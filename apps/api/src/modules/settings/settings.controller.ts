import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
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

const publicSettingsExample = {
  success: true,
  data: {
    studioName: 'Studio Demo',
    tagline: 'Photography studio for weddings and portraits.',
    logo: {
      id: '64f1f2c3a4567890abcdef12',
      url: 'https://cdn.example.com/media/logo-medium.webp',
      width: 640,
      height: 360,
      alt: 'Studio Demo logo',
    },
    favicon: null,
    contact: {
      phone: '0900000000',
      email: 'hello@example.com',
      address: 'Da Nang, Vietnam',
    },
    socials: {
      facebook: 'https://facebook.com/studiodemo',
      instagram: '',
      tiktok: '',
      youtube: '',
      zalo: '',
    },
    navigation: {
      showHome: true,
      showAbout: true,
      showPackages: true,
      showAlbums: true,
      showNews: true,
      showLocations: true,
      showContact: true,
      showBooking: true,
    },
    defaultSeo: {
      title: 'Studio Demo',
      description: 'Wedding and portrait photography studio.',
      ogImage: null,
    },
    footer: {
      description: 'A calm visual studio for meaningful stories.',
      copyrightText: '© 2026 Studio Demo. All rights reserved.',
    },
  },
};

const adminSettingsExample = {
  success: true,
  data: {
    ...publicSettingsExample.data,
    key: 'default',
    logoMediaId: '64f1f2c3a4567890abcdef12',
    faviconMediaId: null,
    defaultSeo: {
      title: 'Studio Demo',
      description: 'Wedding and portrait photography studio.',
      ogImageMediaId: null,
      ogImage: null,
    },
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
  },
};

const updateSettingsExample = {
  studioName: 'Studio Demo',
  tagline: 'Photography studio for weddings and portraits.',
  contact: {
    phone: '0900000000',
    email: 'hello@example.com',
    address: 'Da Nang, Vietnam',
  },
  socials: {
    facebook: 'https://facebook.com/studiodemo',
    instagram: '',
    tiktok: '',
    youtube: '',
    zalo: '',
  },
  navigation: {
    showHome: true,
    showAbout: true,
    showPackages: true,
    showAlbums: true,
    showNews: true,
    showLocations: true,
    showContact: true,
    showBooking: true,
  },
  defaultSeo: {
    title: 'Studio Demo',
    description: 'Wedding and portrait photography studio.',
    ogImageMediaId: null,
  },
};

@ApiTags('Settings')
@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  @ApiOperation({ summary: 'Get public site settings.' })
  @ApiOkResponse({
    description: 'Public settings returned.',
    schema: { example: publicSettingsExample },
  })
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
  @ApiOkResponse({
    description: 'Settings returned.',
    schema: { example: adminSettingsExample },
  })
  async detail(): Promise<AdminSettingsItemResponse> {
    return {
      success: true,
      data: await this.settingsService.getAdminSettings(),
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update singleton settings.' })
  @ApiBody({
    type: UpdateSettingsDto,
    examples: {
      update: {
        summary: 'Update public brand, contact, navigation, and SEO settings.',
        value: updateSettingsExample,
      },
    },
  })
  @ApiOkResponse({
    description: 'Settings updated.',
    schema: { example: adminSettingsExample },
  })
  @ApiBadRequestResponse({
    description: 'Invalid setting value, URL, or image media reference.',
  })
  async update(
    @Body() dto: UpdateSettingsDto,
  ): Promise<AdminSettingsItemResponse> {
    return {
      success: true,
      data: await this.settingsService.updateSettings(dto),
    };
  }
}
