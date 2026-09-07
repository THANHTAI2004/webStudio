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
import { CreatePackageCategoryDto } from './dto/create-package-category.dto';
import { UpdatePackageCategoryDto } from './dto/update-package-category.dto';
import {
  PackageCategoriesService,
  type PublicPackageCategory,
} from './package-categories.service';

interface CategoryListResponse {
  success: true;
  data: PublicPackageCategory[];
}

interface CategoryResponse {
  success: true;
  data: PublicPackageCategory;
}

interface SuccessResponse {
  success: true;
}

@ApiTags('Admin Package Categories')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/package-categories')
export class AdminPackageCategoriesController {
  constructor(
    private readonly packageCategoriesService: PackageCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List package categories for admin.' })
  @ApiOkResponse({ description: 'Package categories returned.' })
  async list(): Promise<CategoryListResponse> {
    return {
      success: true,
      data: await this.packageCategoriesService.listAdmin(),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a package category.' })
  @ApiCreatedResponse({ description: 'Package category created.' })
  async create(
    @Body() dto: CreatePackageCategoryDto,
  ): Promise<CategoryResponse> {
    return {
      success: true,
      data: await this.packageCategoriesService.createCategory(dto),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a package category.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Package category returned.' })
  async detail(@Param('id') id: string): Promise<CategoryResponse> {
    return {
      success: true,
      data: await this.packageCategoriesService.getCategoryById(id),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a package category.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Package category updated.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePackageCategoryDto,
  ): Promise<CategoryResponse> {
    return {
      success: true,
      data: await this.packageCategoriesService.updateCategory(id, dto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a package category.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Package category deleted.' })
  async delete(@Param('id') id: string): Promise<SuccessResponse> {
    await this.packageCategoriesService.deleteCategory(id);

    return {
      success: true,
    };
  }
}

@ApiTags('Package Categories')
@Controller('package-categories')
export class PublicPackageCategoriesController {
  constructor(
    private readonly packageCategoriesService: PackageCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List active package categories.' })
  @ApiOkResponse({ description: 'Active package categories returned.' })
  async list(): Promise<CategoryListResponse> {
    return {
      success: true,
      data: await this.packageCategoriesService.listPublic(),
    };
  }
}
