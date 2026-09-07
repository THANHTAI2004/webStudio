import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { requireConfigValue } from '../../../config/env';
import { AdminsService } from '../../admins/admins.service';
import type { PublicAdmin } from '../../admins/schemas/admin.schema';
import { ACCESS_TOKEN_COOKIE } from '../auth.constants';
import type {
  JwtAccessPayload,
  RequestWithCookies,
} from '../types/jwt-payload.type';

const bearerTokenExtractor = ExtractJwt.fromAuthHeaderAsBearerToken();

function cookieTokenExtractor(request: RequestWithCookies | null): string | null {
  return request?.cookies?.[ACCESS_TOKEN_COOKIE] ?? null;
}

function accessTokenExtractor(request: RequestWithCookies | null): string | null {
  return bearerTokenExtractor(request) ?? cookieTokenExtractor(request);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly adminsService: AdminsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([accessTokenExtractor]),
      ignoreExpiration: false,
      secretOrKey: requireConfigValue(
        configService.get<string>('JWT_ACCESS_SECRET'),
        'JWT_ACCESS_SECRET',
      ),
    });
  }

  async validate(payload: JwtAccessPayload): Promise<PublicAdmin> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException();
    }

    const admin = await this.adminsService.findActiveById(payload.sub);

    if (!admin) {
      throw new UnauthorizedException();
    }

    return this.adminsService.toPublicAdmin(admin);
  }
}
