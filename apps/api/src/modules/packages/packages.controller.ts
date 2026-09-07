import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE } from '../auth/auth.constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePackageDto } from './dto/create-package.dto';
import { QueryPackagesDto } from './dto/query-packages.dto';
import { QueryPublicPackagesDto } from './dto/query-public-packages.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import {
  AdminPackageResponse,
  PackagesService,
  PublicPackageDetail,
  PublicPackageListItem,
} from './packages.service';

interface AdminPackageListResponse {
  success: true;
  data: AdminPackageResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AdminPackageItemResponse {
  success: true;
  data: AdminPackageResponse;
}

interface PublicPackageListResponse {
  success: true;
  data: PublicPackageListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PublicPackageDetailResponse {
  success: true;
  data: PublicPackageDetail;
}

interface SuccessResponse {
  success: true;
}

@ApiTags('Admin Packages')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/packages')
export class AdminPackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @ApiOperation({ summary: 'List packages for admin.' })
  @ApiOkResponse({ description: 'Paginated packages returned.' })
  async list(
    @Query() query: QueryPackagesDto,
  ): Promise<AdminPackageListResponse> {
    const result = await this.packagesService.listAdmin(query);

    return {
      success: true,
      ...result,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a package.' })
  @ApiCreatedResponse({ description: 'Package created.' })
  async create(
    @Body() dto: CreatePackageDto,
  ): Promise<AdminPackageItemResponse> {
    return {
      success: true,
      data: await this.packagesService.createPackage(dto),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a package for admin.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Package returned.' })
  async detail(@Param('id') id: string): Promise<AdminPackageItemResponse> {
    return {
      success: true,
      data: await this.packagesService.getAdminPackageById(id),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a package.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Package updated.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePackageDto,
  ): Promise<AdminPackageItemResponse> {
    return {
      success: true,
      data: await this.packagesService.updatePackage(id, dto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a package.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Package deleted.' })
  async delete(@Param('id') id: string): Promise<SuccessResponse> {
    await this.packagesService.deletePackage(id);

    return {
      success: true,
    };
  }
}

@ApiTags('Packages')
@Controller('packages')
export class PublicPackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @ApiOperation({ summary: 'List published packages.' })
  @ApiOkResponse({ description: 'Paginated published packages returned.' })
  async list(
    @Query() query: QueryPublicPackagesDto,
  ): Promise<PublicPackageListResponse> {
    const result = await this.packagesService.listPublic(query);

    return {
      success: true,
      ...result,
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published package by slug.' })
  @ApiParam({ name: 'slug' })
  @ApiOkResponse({ description: 'Published package returned.' })
  async detail(
    @Param('slug') slug: string,
  ): Promise<PublicPackageDetailResponse> {
    return {
      success: true,
      data: await this.packagesService.getPublicPackageBySlug(slug),
    };
  }
}
