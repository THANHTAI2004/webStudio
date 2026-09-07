import path from 'node:path';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { PublicAdmin } from '../admins/schemas/admin.schema';
import {
  IMAGE_VARIANTS,
  MEDIA_TYPE_IMAGE,
  type ImageVariantName,
} from './media.constants';
import { QueryMediaDto } from './dto/query-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import {
  Media,
  MediaDocument,
  StoredImageVariant,
  StoredImageVariants,
} from './schemas/media.schema';
import { MediaProcessingService } from './media-processing.service';
import { MediaStorageService } from './media-storage.service';

export interface PublicMediaVariant {
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface PublicMedia {
  id: string;
  type: 'image';
  originalName: string;
  mimeType: string;
  originalSize: number;
  width: number;
  height: number;
  original: {
    url: string;
  };
  variants: Record<ImageVariantName, PublicMediaVariant>;
  alt: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedMedia {
  data: PublicMedia[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name)
    private readonly mediaModel: Model<Media>,
    private readonly mediaStorageService: MediaStorageService,
    private readonly mediaProcessingService: MediaProcessingService,
  ) {}

  async uploadImages(
    files: Express.Multer.File[],
    admin: PublicAdmin,
  ): Promise<PublicMedia[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException({
        code: 'UPLOAD_FAILED',
        message: 'At least one image file is required.',
      });
    }

    const createdDocuments: MediaDocument[] = [];
    const createdDirectories = new Set<string>();

    try {
      await this.mediaStorageService.ensureInitialized();

      for (const file of files) {
        const media = await this.uploadOneImage(file, admin);

        createdDocuments.push(media);
        createdDirectories.add(media.directory);
      }

      return createdDocuments.map((media) => this.toPublicMedia(media));
    } catch (error) {
      await this.rollbackUpload(createdDocuments, createdDirectories);

      if (error instanceof Error) {
        throw error;
      }

      throw new InternalServerErrorException({
        code: 'UPLOAD_FAILED',
        message: 'Upload failed.',
      });
    } finally {
      await this.mediaStorageService.cleanupTempFiles(files);
    }
  }

  async listMedia(query: QueryMediaDto): Promise<PaginatedMedia> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 24;
    const filter = this.buildMediaFilter(query.search);
    const sort = this.buildMediaSort(query.sort);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.mediaModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.mediaModel.countDocuments(filter).exec(),
    ]);

    return {
      data: items.map((media) => this.toPublicMedia(media)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getMediaById(id: string): Promise<PublicMedia> {
    const media = await this.findMediaDocument(id);

    return this.toPublicMedia(media);
  }

  async updateMedia(id: string, updateMediaDto: UpdateMediaDto): Promise<PublicMedia> {
    const media = await this.findMediaDocument(id);

    if (updateMediaDto.alt !== undefined) {
      media.alt = updateMediaDto.alt.trim();
    }

    await media.save();

    return this.toPublicMedia(media);
  }

  async deleteMedia(id: string): Promise<void> {
    const media = await this.findMediaDocument(id);

    await this.mediaStorageService.deleteMediaDirectory(media.directory);
    await this.mediaModel.deleteOne({ _id: media._id }).exec();
  }

  private async uploadOneImage(
    file: Express.Multer.File,
    admin: PublicAdmin,
  ): Promise<MediaDocument> {
    const inspection = await this.mediaProcessingService.inspectImage(file);
    const directory = await this.mediaStorageService.createMediaDirectory();

    try {
      const originalRelativePath = `${directory}/original.${inspection.originalExtension}`;

      await this.mediaStorageService.moveTempFile(
        file.path,
        originalRelativePath,
      );

      const originalPath =
        this.mediaStorageService.resolveFinalPath(originalRelativePath);
      const variants = await this.createVariants(originalPath, directory);

      return await this.mediaModel.create({
        type: MEDIA_TYPE_IMAGE,
        originalName: this.sanitizeOriginalName(file.originalname),
        mimeType: inspection.mimeType,
        originalSize: file.size,
        width: inspection.width,
        height: inspection.height,
        directory,
        original: {
          path: originalRelativePath,
          url: this.mediaStorageService.toPublicUrl(originalRelativePath),
        },
        variants,
        alt: '',
        createdByAdminId: new Types.ObjectId(admin.id),
      });
    } catch (error) {
      await this.mediaStorageService.deleteMediaDirectory(directory);
      throw error;
    }
  }

  private async createVariants(
    originalPath: string,
    directory: string,
  ): Promise<StoredImageVariants> {
    const variants = {} as StoredImageVariants;

    for (const [variantName, variantWidth] of Object.entries(IMAGE_VARIANTS)) {
      const name = variantName as ImageVariantName;
      const relativePath = `${directory}/${name}.webp`;
      const finalPath = this.mediaStorageService.resolveFinalPath(relativePath);
      const output = await this.mediaProcessingService.createWebpVariant(
        originalPath,
        finalPath,
        variantWidth,
      );

      variants[name] = {
        path: relativePath,
        url: this.mediaStorageService.toPublicUrl(relativePath),
        width: output.width,
        height: output.height,
        size: output.size,
      };
    }

    return variants;
  }

  private async rollbackUpload(
    createdDocuments: MediaDocument[],
    createdDirectories: Set<string>,
  ): Promise<void> {
    for (const media of createdDocuments) {
      await this.mediaModel.deleteOne({ _id: media._id }).exec().catch(() => {
        return;
      });
    }

    for (const directory of createdDirectories) {
      await this.mediaStorageService.deleteMediaDirectory(directory).catch(() => {
        return;
      });
    }
  }

  private async findMediaDocument(id: string): Promise<MediaDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        code: 'INVALID_MEDIA_ID',
        message: 'Media id is invalid.',
      });
    }

    const media = await this.mediaModel.findById(id).exec();

    if (!media) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media was not found.',
      });
    }

    return media;
  }

  private buildMediaFilter(search?: string): Record<string, unknown> {
    const trimmedSearch = search?.trim();

    if (!trimmedSearch) {
      return {};
    }

    const escapedSearch = escapeRegex(trimmedSearch);

    return {
      $or: [
        {
          originalName: {
            $regex: escapedSearch,
            $options: 'i',
          },
        },
        {
          alt: {
            $regex: escapedSearch,
            $options: 'i',
          },
        },
      ],
    };
  }

  private buildMediaSort(sort?: string): Record<string, 1 | -1> {
    switch (sort) {
      case 'createdAt:asc':
        return { createdAt: 1 };
      case 'originalName:asc':
        return { originalName: 1 };
      case 'originalName:desc':
        return { originalName: -1 };
      case 'createdAt:desc':
      default:
        return { createdAt: -1 };
    }
  }

  private sanitizeOriginalName(originalName: string): string {
    const baseName = path.basename(originalName).replaceAll(/\s+/g, ' ').trim();

    return baseName.slice(0, 255) || 'image';
  }

  private toPublicMedia(media: MediaDocument): PublicMedia {
    return {
      id: media._id.toString(),
      type: media.type,
      originalName: media.originalName,
      mimeType: media.mimeType,
      originalSize: media.originalSize,
      width: media.width,
      height: media.height,
      original: {
        url: media.original.url,
      },
      variants: toPublicVariants(media.variants),
      alt: media.alt,
      createdAt: media.createdAt.toISOString(),
      updatedAt: media.updatedAt.toISOString(),
    };
  }
}

function toPublicVariants(
  variants: StoredImageVariants,
): Record<ImageVariantName, PublicMediaVariant> {
  return {
    thumb: toPublicVariant(variants.thumb),
    small: toPublicVariant(variants.small),
    medium: toPublicVariant(variants.medium),
    large: toPublicVariant(variants.large),
  };
}

function toPublicVariant(variant: StoredImageVariant): PublicMediaVariant {
  return {
    url: variant.url,
    width: variant.width,
    height: variant.height,
    size: variant.size,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
