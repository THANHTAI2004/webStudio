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
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { PublicAdmin } from '../admins/schemas/admin.schema';
import { ACCESS_TOKEN_COOKIE } from '../auth/auth.constants';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryMediaDto } from './dto/query-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaUploadExceptionFilter } from './media-upload-exception.filter';
import { MediaService, type PublicMedia } from './media.service';

interface MediaListResponse {
  success: true;
  data: PublicMedia[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface MediaItemsResponse {
  success: true;
  data: PublicMedia[];
}

interface MediaItemResponse {
  success: true;
  data: PublicMedia;
}

interface SuccessResponse {
  success: true;
}

@ApiTags('Admin Media')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseFilters(MediaUploadExceptionFilter)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Upload one or more admin media images.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['files'],
    },
  })
  @ApiOkResponse({
    description: 'Images were uploaded and processed successfully.',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: '65f0f0000000000000000000',
            originalName: 'photo.jpg',
            width: 6000,
            height: 4000,
            variants: {
              thumb: {
                url: '/uploads/2026/09/uuid/thumb.webp',
              },
              small: {
                url: '/uploads/2026/09/uuid/small.webp',
              },
              medium: {
                url: '/uploads/2026/09/uuid/medium.webp',
              },
              large: {
                url: '/uploads/2026/09/uuid/large.webp',
              },
            },
          },
        ],
      },
    },
  })
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentAdmin() admin: PublicAdmin,
  ): Promise<MediaItemsResponse> {
    return {
      success: true,
      data: await this.mediaService.uploadImages(files, admin),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List admin media.' })
  @ApiOkResponse({
    description: 'Paginated media list.',
  })
  async list(@Query() query: QueryMediaDto): Promise<MediaListResponse> {
    const result = await this.mediaService.listMedia(query);

    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media details.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({
    description: 'Media detail.',
  })
  async detail(@Param('id') id: string): Promise<MediaItemResponse> {
    return {
      success: true,
      data: await this.mediaService.getMediaById(id),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media metadata.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({
    description: 'Media metadata updated.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ): Promise<MediaItemResponse> {
    return {
      success: true,
      data: await this.mediaService.updateMedia(id, updateMediaDto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete media and its local files.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({
    description: 'Media deleted.',
    schema: {
      example: {
        success: true,
      },
    },
  })
  async delete(@Param('id') id: string): Promise<SuccessResponse> {
    await this.mediaService.deleteMedia(id);

    return {
      success: true,
    };
  }
}
