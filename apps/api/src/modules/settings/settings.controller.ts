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
import { UpdateSettingsDto } from './dto/update-settings.dto';
import {
  AdminSettingsResponse,
  PublicSettingsResponse,
  SettingsService,
} from './settings.service';

interface PublicSettingsItemResponse {
  success: true;
  data: PublicSettingsResponse;
}

interface AdminSettingsItemResponse {
  success: true;
  data: AdminSettingsResponse;
}

@ApiTags('Settings')
@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  @ApiOperation({ summary: 'Get public site settings.' })
  @ApiOkResponse({ description: 'Public settings returned.' })
  async detail(): Promise<PublicSettingsItemResponse> {
    return {
      success: true,
      data: await this.settingsService.getPublicSettings(),
    };
  }
}

@ApiTags('Admin Settings')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get singleton settings for admin.' })
  @ApiOkResponse({ description: 'Settings returned.' })
  async detail(): Promise<AdminSettingsItemResponse> {
    return {
      success: true,
      data: await this.settingsService.getAdminSettings(),
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update singleton settings.' })
  @ApiOkResponse({ description: 'Settings updated.' })
  async update(
    @Body() dto: UpdateSettingsDto,
  ): Promise<AdminSettingsItemResponse> {
    return {
      success: true,
      data: await this.settingsService.updateSettings(dto),
    };
  }
}

