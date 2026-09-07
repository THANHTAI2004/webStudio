import { createHash, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { verify } from 'argon2';
import { Model, Types } from 'mongoose';
import {
  DEFAULT_JWT_ACCESS_TTL,
  DEFAULT_JWT_REFRESH_TTL,
  JwtTtl,
  parseDurationMs,
  readJwtTtl,
  requireConfigValue,
} from '../../config/env';
import { AdminsService, normalizeAdminEmail } from '../admins/admins.service';
import type {
  AdminDocument,
  PublicAdmin,
} from '../admins/schemas/admin.schema';
import { INVALID_ADMIN_CREDENTIALS_MESSAGE } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { AuthSession } from './schemas/auth-session.schema';
import type {
  JwtAccessPayload,
  JwtRefreshPayload,
} from './types/jwt-payload.type';

interface RequestMetadata {
  userAgent: string | null;
  ipAddress: string | null;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessMaxAgeMs: number;
  refreshMaxAgeMs: number;
}

interface LoginResult extends AuthTokens {
  admin: PublicAdmin;
}

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtl: JwtTtl;
  private readonly refreshTtl: JwtTtl;
  private readonly accessMaxAgeMs: number;
  private readonly refreshMaxAgeMs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly adminsService: AdminsService,
    @InjectModel(AuthSession.name)
    private readonly authSessionModel: Model<AuthSession>,
  ) {
    this.accessSecret = requireConfigValue(
      this.configService.get<string>('JWT_ACCESS_SECRET'),
      'JWT_ACCESS_SECRET',
    );
    this.refreshSecret = requireConfigValue(
      this.configService.get<string>('JWT_REFRESH_SECRET'),
      'JWT_REFRESH_SECRET',
    );
    this.accessTtl = readJwtTtl(
      this.configService.get<string>('JWT_ACCESS_TTL'),
      DEFAULT_JWT_ACCESS_TTL,
      'JWT_ACCESS_TTL',
    );
    this.refreshTtl = readJwtTtl(
      this.configService.get<string>('JWT_REFRESH_TTL'),
      DEFAULT_JWT_REFRESH_TTL,
      'JWT_REFRESH_TTL',
    );
    this.accessMaxAgeMs = parseDurationMs(this.accessTtl);
    this.refreshMaxAgeMs = parseDurationMs(this.refreshTtl);
  }

  async login(
    loginDto: LoginDto,
    metadata: RequestMetadata,
  ): Promise<LoginResult> {
    const email = normalizeAdminEmail(loginDto.email);
    const admin = await this.adminsService.findByEmailWithPassword(email);

    if (!admin || !admin.isActive) {
      this.throwInvalidCredentials();
    }

    const isPasswordValid = await this.verifyPassword(
      admin.passwordHash,
      loginDto.password,
    );

    if (!isPasswordValid) {
      this.throwInvalidCredentials();
    }

    const tokens = await this.createSessionTokens(admin, metadata);
    await this.adminsService.markLastLogin(admin._id);

    return {
      ...tokens,
      admin: this.adminsService.toPublicAdmin(admin),
    };
  }

  async refresh(refreshToken: string | undefined): Promise<AuthTokens> {
    if (!refreshToken) {
      this.throwInvalidRefreshToken();
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.authSessionModel.findById(payload.sid).exec();

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      session.adminId.toString() !== payload.sub
    ) {
      this.throwInvalidRefreshToken();
    }

    const incomingHash = this.hashRefreshToken(refreshToken);

    if (!this.isHashEqual(incomingHash, session.refreshTokenHash)) {
      this.throwInvalidRefreshToken();
    }

    const admin = await this.adminsService.findActiveById(session.adminId);

    if (!admin) {
      this.throwInvalidRefreshToken();
    }

    const tokens = await this.createTokens(admin, session._id);

    session.refreshTokenHash = this.hashRefreshToken(tokens.refreshToken);
    session.expiresAt = this.getRefreshExpiresAt();
    await session.save();

    return tokens;
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const payload = await this.verifyRefreshTokenForLogout(refreshToken);

    if (!payload) {
      return;
    }

    const session = await this.authSessionModel.findById(payload.sid).exec();

    if (
      !session ||
      session.revokedAt ||
      session.adminId.toString() !== payload.sub
    ) {
      return;
    }

    const incomingHash = this.hashRefreshToken(refreshToken);

    if (!this.isHashEqual(incomingHash, session.refreshTokenHash)) {
      return;
    }

    session.revokedAt = new Date();
    await session.save();
  }

  private async createSessionTokens(
    admin: AdminDocument,
    metadata: RequestMetadata,
  ): Promise<AuthTokens> {
    const sessionId = new Types.ObjectId();
    const tokens = await this.createTokens(admin, sessionId);

    await this.authSessionModel.create({
      _id: sessionId,
      adminId: admin._id,
      refreshTokenHash: this.hashRefreshToken(tokens.refreshToken),
      expiresAt: this.getRefreshExpiresAt(),
      revokedAt: null,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    });

    return tokens;
  }

  private async createTokens(
    admin: AdminDocument,
    sessionId: Types.ObjectId,
  ): Promise<AuthTokens> {
    const accessPayload: JwtAccessPayload = {
      sub: admin._id.toString(),
      role: admin.role,
      type: 'access',
    };
    const refreshPayload: JwtRefreshPayload = {
      sub: admin._id.toString(),
      sid: sessionId.toString(),
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.accessSecret,
        expiresIn: this.accessTtl,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshTtl,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      accessMaxAgeMs: this.accessMaxAgeMs,
      refreshMaxAgeMs: this.refreshMaxAgeMs,
    };
  }

  private async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
        token,
        {
          secret: this.refreshSecret,
        },
      );

      if (payload.type !== 'refresh' || !payload.sub || !payload.sid) {
        this.throwInvalidRefreshToken();
      }

      return payload;
    } catch {
      this.throwInvalidRefreshToken();
    }
  }

  private async verifyRefreshTokenForLogout(
    token: string,
  ): Promise<JwtRefreshPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
        token,
        {
          secret: this.refreshSecret,
          ignoreExpiration: true,
        },
      );

      if (payload.type !== 'refresh' || !payload.sub || !payload.sid) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private async verifyPassword(
    passwordHash: string,
    password: string,
  ): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  }

  private getRefreshExpiresAt(): Date {
    return new Date(Date.now() + this.refreshMaxAgeMs);
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isHashEqual(incomingHash: string, storedHash: string): boolean {
    const incomingBuffer = Buffer.from(incomingHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (incomingBuffer.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(incomingBuffer, storedBuffer);
  }

  private throwInvalidCredentials(): never {
    throw new UnauthorizedException(INVALID_ADMIN_CREDENTIALS_MESSAGE);
  }

  private throwInvalidRefreshToken(): never {
    throw new UnauthorizedException('Refresh token khong hop le');
  }
}
