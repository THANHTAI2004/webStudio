import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { PublicAdmin } from '../admins/schemas/admin.schema';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from './auth.constants';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import type { RequestWithCookies } from './types/jwt-payload.type';

interface LoginResponse {
  success: true;
  data: {
    admin: PublicAdmin;
  };
}

interface MeResponse {
  success: true;
  data: PublicAdmin;
}

interface SuccessResponse {
  success: true;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in an admin and set auth cookies.' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Admin logged in successfully.',
    schema: {
      example: {
        success: true,
        data: {
          admin: {
            id: '65f0f0000000000000000000',
            name: 'Studio Admin',
            email: 'admin@studio.local',
            role: 'admin',
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Email or password is invalid.',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const result = await this.authService.login(loginDto, {
      userAgent: request.get('user-agent') ?? null,
      ipAddress: request.ip ?? request.socket.remoteAddress ?? null,
    });

    this.setAuthCookies(response, result);

    return {
      success: true,
      data: {
        admin: result.admin,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue a new access token.' })
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE)
  @ApiOkResponse({
    description: 'Auth cookies were refreshed successfully.',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is missing or invalid.',
  })
  async refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SuccessResponse> {
    try {
      const result = await this.authService.refresh(
        request.cookies?.[REFRESH_TOKEN_COOKIE],
      );

      this.setAuthCookies(response, result);

      return {
        success: true,
      };
    } catch (error) {
      this.clearAuthCookies(response);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out the current admin session.' })
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE)
  @ApiOkResponse({
    description: 'Logout completed successfully.',
    schema: {
      example: {
        success: true,
      },
    },
  })
  async logout(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SuccessResponse> {
    await this.authService.logout(request.cookies?.[REFRESH_TOKEN_COOKIE]);
    this.clearAuthCookies(response);

    return {
      success: true,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the authenticated admin profile.' })
  @ApiBearerAuth()
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE)
  @ApiOkResponse({
    description: 'Current admin profile.',
    schema: {
      example: {
        success: true,
        data: {
          id: '65f0f0000000000000000000',
          name: 'Studio Admin',
          email: 'admin@studio.local',
          role: 'admin',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
  })
  getMe(@CurrentAdmin() admin: PublicAdmin): MeResponse {
    return {
      success: true,
      data: admin,
    };
  }

  private setAuthCookies(
    response: Response,
    tokens: {
      accessToken: string;
      refreshToken: string;
      accessMaxAgeMs: number;
      refreshMaxAgeMs: number;
    },
  ): void {
    response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...this.getBaseCookieOptions(),
      maxAge: tokens.accessMaxAgeMs,
    });
    response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...this.getBaseCookieOptions(),
      maxAge: tokens.refreshMaxAgeMs,
    });
  }

  private clearAuthCookies(response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, this.getBaseCookieOptions());
    response.clearCookie(REFRESH_TOKEN_COOKIE, this.getBaseCookieOptions());
  }

  private getBaseCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };
  }
}
