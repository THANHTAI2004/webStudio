import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE } from '../auth/auth.constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { ThemeResponse, ThemeService } from './theme.service';

interface ThemeItemResponse {
  success: true;
  data: ThemeResponse;
}

@ApiTags('Theme')
@Controller('theme')
export class PublicThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  @ApiOperation({ summary: 'Get public site theme.' })
  @ApiOkResponse({ description: 'Theme returned.' })
  async detail(): Promise<ThemeItemResponse> {
    return {
      success: true,
      data: await this.themeService.getPublicTheme(),
    };
  }
}

@ApiTags('Admin Theme')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/theme')
export class AdminThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  @ApiOperation({ summary: 'Get singleton theme for admin.' })
  @ApiOkResponse({ description: 'Theme returned.' })
  async detail(): Promise<ThemeItemResponse> {
    return {
      success: true,
      data: await this.themeService.getAdminTheme(),
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update singleton theme.' })
  @ApiOkResponse({ description: 'Theme updated.' })
  async update(@Body() dto: UpdateThemeDto): Promise<ThemeItemResponse> {
    return {
      success: true,
      data: await this.themeService.updateTheme(dto),
    };
  }
}

