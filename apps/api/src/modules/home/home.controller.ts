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
import { UpdateHomeDto } from './dto/update-home.dto';
import {
  AdminHomeResponse,
  HomeService,
  PublicHomeResponse,
} from './home.service';

interface PublicHomeItemResponse {
  success: true;
  data: PublicHomeResponse;
}

interface AdminHomeItemResponse {
  success: true;
  data: AdminHomeResponse;
}

@ApiTags('Home')
@Controller('home')
export class PublicHomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ApiOperation({ summary: 'Get resolved homepage content.' })
  @ApiOkResponse({ description: 'Homepage returned.' })
  async detail(): Promise<PublicHomeItemResponse> {
    return {
      success: true,
      data: await this.homeService.getPublicHome(),
    };
  }
}

@ApiTags('Admin Home')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/home')
export class AdminHomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ApiOperation({ summary: 'Get singleton homepage content for admin.' })
  @ApiOkResponse({ description: 'Homepage returned.' })
  async detail(): Promise<AdminHomeItemResponse> {
    return {
      success: true,
      data: await this.homeService.getAdminHome(),
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update singleton homepage content.' })
  @ApiOkResponse({ description: 'Homepage updated.' })
  async update(@Body() dto: UpdateHomeDto): Promise<AdminHomeItemResponse> {
    return {
      success: true,
      data: await this.homeService.updateHome(dto),
    };
  }
}

