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
import { AboutService, AdminAboutResponse, PublicAboutResponse } from './about.service';
import { UpdateAboutDto } from './dto/update-about.dto';

interface PublicAboutItemResponse {
  success: true;
  data: PublicAboutResponse;
}

interface AdminAboutItemResponse {
  success: true;
  data: AdminAboutResponse;
}

@ApiTags('About')
@Controller('about')
export class PublicAboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  @ApiOperation({ summary: 'Get public about page content.' })
  @ApiOkResponse({ description: 'About page returned.' })
  async detail(): Promise<PublicAboutItemResponse> {
    return {
      success: true,
      data: await this.aboutService.getPublicAbout(),
    };
  }
}

@ApiTags('Admin About')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/about')
export class AdminAboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  @ApiOperation({ summary: 'Get singleton about page content for admin.' })
  @ApiOkResponse({ description: 'About page returned.' })
  async detail(): Promise<AdminAboutItemResponse> {
    return {
      success: true,
      data: await this.aboutService.getAdminAbout(),
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update singleton about page content.' })
  @ApiOkResponse({ description: 'About page updated.' })
  async update(@Body() dto: UpdateAboutDto): Promise<AdminAboutItemResponse> {
    return {
      success: true,
      data: await this.aboutService.updateAbout(dto),
    };
  }
}

