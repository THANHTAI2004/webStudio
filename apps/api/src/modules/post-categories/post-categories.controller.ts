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
  PostCategoriesService,
  type PublicPostCategory,
} from './post-categories.service';
import { CreatePostCategoryDto } from './dto/create-post-category.dto';
import { UpdatePostCategoryDto } from './dto/update-post-category.dto';

interface CategoryListResponse {
  success: true;
  data: PublicPostCategory[];
}

interface CategoryResponse {
  success: true;
  data: PublicPostCategory;
}

interface SuccessResponse {
  success: true;
}

@ApiTags('Admin Post Categories')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/post-categories')
export class AdminPostCategoriesController {
  constructor(private readonly postCategoriesService: PostCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List post categories for admin.' })
  @ApiOkResponse({
    description: 'Post categories returned.',
    schema: {
      example: {
        success: true,
        data: [],
      },
    },
  })
  async list(): Promise<CategoryListResponse> {
    return {
      success: true,
      data: await this.postCategoriesService.listAdmin(),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a post category.' })
  @ApiCreatedResponse({ description: 'Post category created.' })
  async create(@Body() dto: CreatePostCategoryDto): Promise<CategoryResponse> {
    return {
      success: true,
      data: await this.postCategoriesService.createCategory(dto),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post category.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Post category returned.' })
  async detail(@Param('id') id: string): Promise<CategoryResponse> {
    return {
      success: true,
      data: await this.postCategoriesService.getCategoryById(id),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post category.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Post category updated.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostCategoryDto,
  ): Promise<CategoryResponse> {
    return {
      success: true,
      data: await this.postCategoriesService.updateCategory(id, dto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a post category.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Post category deleted.' })
  async delete(@Param('id') id: string): Promise<SuccessResponse> {
    await this.postCategoriesService.deleteCategory(id);

    return {
      success: true,
    };
  }
}

@ApiTags('Post Categories')
@Controller('post-categories')
export class PublicPostCategoriesController {
  constructor(private readonly postCategoriesService: PostCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List active post categories.' })
  @ApiOkResponse({
    description: 'Active post categories returned.',
    schema: {
      example: {
        success: true,
        data: [],
      },
    },
  })
  async list(): Promise<CategoryListResponse> {
    return {
      success: true,
      data: await this.postCategoriesService.listPublic(),
    };
  }
}
