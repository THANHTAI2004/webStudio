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
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { QueryPublicPostsDto } from './dto/query-public-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';
import type {
  AdminPostResponse,
  PublicPostDetail,
  PublicPostListItem,
} from './posts.service';

interface AdminPostListResponse {
  success: true;
  data: AdminPostResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AdminPostItemResponse {
  success: true;
  data: AdminPostResponse;
}

interface PublicPostListResponse {
  success: true;
  data: PublicPostListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PublicPostDetailResponse {
  success: true;
  data: PublicPostDetail;
}

interface SuccessResponse {
  success: true;
}

@ApiTags('Admin Posts')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/posts')
export class AdminPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List posts for admin.' })
  @ApiOkResponse({
    description: 'Paginated posts returned.',
    schema: {
      example: {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      },
    },
  })
  async list(@Query() query: QueryPostsDto): Promise<AdminPostListResponse> {
    const result = await this.postsService.listAdmin(query);

    return {
      success: true,
      ...result,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a post.' })
  @ApiCreatedResponse({ description: 'Post created.' })
  async create(@Body() dto: CreatePostDto): Promise<AdminPostItemResponse> {
    return {
      success: true,
      data: await this.postsService.createPost(dto),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post for admin.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Post returned.' })
  async detail(@Param('id') id: string): Promise<AdminPostItemResponse> {
    return {
      success: true,
      data: await this.postsService.getAdminPostById(id),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Post updated.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ): Promise<AdminPostItemResponse> {
    return {
      success: true,
      data: await this.postsService.updatePost(id, dto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a post.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Post deleted.' })
  async delete(@Param('id') id: string): Promise<SuccessResponse> {
    await this.postsService.deletePost(id);

    return {
      success: true,
    };
  }
}

@ApiTags('Posts')
@Controller('posts')
export class PublicPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List published posts.' })
  @ApiOkResponse({
    description: 'Paginated published posts returned.',
    schema: {
      example: {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
        },
      },
    },
  })
  async list(
    @Query() query: QueryPublicPostsDto,
  ): Promise<PublicPostListResponse> {
    const result = await this.postsService.listPublic(query);

    return {
      success: true,
      ...result,
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published post by slug.' })
  @ApiParam({ name: 'slug' })
  @ApiOkResponse({ description: 'Published post returned.' })
  async detail(@Param('slug') slug: string): Promise<PublicPostDetailResponse> {
    return {
      success: true,
      data: await this.postsService.getPublicPostBySlug(slug),
    };
  }
}
