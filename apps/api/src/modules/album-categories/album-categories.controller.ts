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
import {
  AlbumCategoriesService,
  type PublicAlbumCategory,
} from './album-categories.service';
import { CreateAlbumCategoryDto } from './dto/create-album-category.dto';
import { UpdateAlbumCategoryDto } from './dto/update-album-category.dto';

interface CategoryListResponse {
  success: true;
  data: PublicAlbumCategory[];
}

interface CategoryResponse {
  success: true;
  data: PublicAlbumCategory;
}

interface SuccessResponse {
  success: true;
}

@ApiTags('Admin Album Categories')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/album-categories')
export class AdminAlbumCategoriesController {
  constructor(
    private readonly albumCategoriesService: AlbumCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List album categories for admin.' })
  @ApiOkResponse({ description: 'Album categories returned.' })
  async list(): Promise<CategoryListResponse> {
    return {
      success: true,
      data: await this.albumCategoriesService.listAdmin(),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create an album category.' })
  @ApiCreatedResponse({ description: 'Album category created.' })
  async create(@Body() dto: CreateAlbumCategoryDto): Promise<CategoryResponse> {
    return {
      success: true,
      data: await this.albumCategoriesService.createCategory(dto),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an album category.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Album category returned.' })
  async detail(@Param('id') id: string): Promise<CategoryResponse> {
    return {
      success: true,
      data: await this.albumCategoriesService.getCategoryById(id),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an album category.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Album category updated.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAlbumCategoryDto,
  ): Promise<CategoryResponse> {
    return {
      success: true,
      data: await this.albumCategoriesService.updateCategory(id, dto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an album category.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Album category deleted.' })
  async delete(@Param('id') id: string): Promise<SuccessResponse> {
    await this.albumCategoriesService.deleteCategory(id);

    return {
      success: true,
    };
  }
}

@ApiTags('Album Categories')
@Controller('album-categories')
export class PublicAlbumCategoriesController {
  constructor(
    private readonly albumCategoriesService: AlbumCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List active album categories.' })
  @ApiOkResponse({ description: 'Active album categories returned.' })
  async list(): Promise<CategoryListResponse> {
    return {
      success: true,
      data: await this.albumCategoriesService.listPublic(),
    };
  }
}
