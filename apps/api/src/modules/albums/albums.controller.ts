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
import { AlbumsService } from './albums.service';
import type {
  AdminAlbumResponse,
  PublicAlbumDetail,
  PublicAlbumListItem,
} from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { QueryAlbumsDto } from './dto/query-albums.dto';
import { QueryPublicAlbumsDto } from './dto/query-public-albums.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

interface AdminAlbumListResponse {
  success: true;
  data: AdminAlbumResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AdminAlbumItemResponse {
  success: true;
  data: AdminAlbumResponse;
}

interface PublicAlbumListResponse {
  success: true;
  data: PublicAlbumListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PublicAlbumDetailResponse {
  success: true;
  data: PublicAlbumDetail;
}

interface SuccessResponse {
  success: true;
}

@ApiTags('Admin Albums')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/albums')
export class AdminAlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get()
  @ApiOperation({ summary: 'List albums for admin.' })
  @ApiOkResponse({
    description: 'Paginated albums returned.',
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
  async list(@Query() query: QueryAlbumsDto): Promise<AdminAlbumListResponse> {
    const result = await this.albumsService.listAdmin(query);

    return {
      success: true,
      ...result,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create an album.' })
  @ApiCreatedResponse({ description: 'Album created.' })
  async create(@Body() dto: CreateAlbumDto): Promise<AdminAlbumItemResponse> {
    return {
      success: true,
      data: await this.albumsService.createAlbum(dto),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an album for admin.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Album returned.' })
  async detail(@Param('id') id: string): Promise<AdminAlbumItemResponse> {
    return {
      success: true,
      data: await this.albumsService.getAdminAlbumById(id),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an album.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Album updated.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAlbumDto,
  ): Promise<AdminAlbumItemResponse> {
    return {
      success: true,
      data: await this.albumsService.updateAlbum(id, dto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an album.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Album deleted.' })
  async delete(@Param('id') id: string): Promise<SuccessResponse> {
    await this.albumsService.deleteAlbum(id);

    return {
      success: true,
    };
  }
}

@ApiTags('Albums')
@Controller('albums')
export class PublicAlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get()
  @ApiOperation({ summary: 'List published albums.' })
  @ApiOkResponse({
    description: 'Paginated published albums returned.',
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
    @Query() query: QueryPublicAlbumsDto,
  ): Promise<PublicAlbumListResponse> {
    const result = await this.albumsService.listPublic(query);

    return {
      success: true,
      ...result,
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published album by slug.' })
  @ApiParam({ name: 'slug' })
  @ApiOkResponse({ description: 'Published album returned.' })
  async detail(
    @Param('slug') slug: string,
  ): Promise<PublicAlbumDetailResponse> {
    return {
      success: true,
      data: await this.albumsService.getPublicAlbumBySlug(slug),
    };
  }
}
