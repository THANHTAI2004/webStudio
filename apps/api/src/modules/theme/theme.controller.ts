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
import { UpdateThemeDto } from './dto/update-theme.dto';
import { ThemeResponse, ThemeService } from './theme.service';

interface ThemeItemResponse {
  success: true;
  data: ThemeResponse;
}

const themeExample = {
  success: true,
  data: {
    colors: {
      primary: '#0F766E',
      secondary: '#111827',
      background: '#FAFAF9',
      surface: '#FFFFFF',
      text: '#18181B',
      mutedText: '#52525B',
      border: '#E4E4E7',
      accent: '#C9A96E',
    },
    buttons: {
      radius: 6,
      style: 'solid',
    },
    cards: {
      radius: 8,
    },
    layout: {
      maxWidth: 1152,
    },
    typography: {
      headingFont: 'sans',
      bodyFont: 'sans',
    },
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
  },
};

const adminThemeExample = {
  success: true,
  data: {
    ...themeExample.data,
    key: 'default',
  },
};

const updateThemeExample = {
  colors: {
    primary: '#0F766E',
    secondary: '#111827',
    background: '#FAFAF9',
    surface: '#FFFFFF',
    text: '#18181B',
    mutedText: '#52525B',
    border: '#E4E4E7',
    accent: '#C9A96E',
  },
  buttons: {
    radius: 6,
    style: 'solid',
  },
  cards: {
    radius: 8,
  },
  layout: {
    maxWidth: 1152,
  },
  typography: {
    headingFont: 'sans',
    bodyFont: 'sans',
  },
};

@ApiTags('Theme')
@Controller('theme')
export class PublicThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  @ApiOperation({ summary: 'Get public site theme.' })
  @ApiOkResponse({
    description: 'Theme returned.',
    schema: { example: themeExample },
  })
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
  @ApiOkResponse({
    description: 'Theme returned.',
    schema: { example: adminThemeExample },
  })
  async detail(): Promise<ThemeItemResponse> {
    return {
      success: true,
      data: await this.themeService.getAdminTheme(),
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update singleton theme.' })
  @ApiBody({
    type: UpdateThemeDto,
    examples: {
      update: {
        summary: 'Update safe theme tokens used as public CSS variables.',
        value: updateThemeExample,
      },
    },
  })
  @ApiOkResponse({
    description: 'Theme updated.',
    schema: { example: adminThemeExample },
  })
  @ApiBadRequestResponse({
    description: 'Invalid color, radius, max width, button style, or font enum.',
  })
  async update(@Body() dto: UpdateThemeDto): Promise<ThemeItemResponse> {
    return {
      success: true,
      data: await this.themeService.updateTheme(dto),
    };
  }
}
