import {
  BadRequestException,
  HttpException,
  Injectable,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import sharp, { type OutputInfo } from 'sharp';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_FORMAT_TO_MIME,
  IMAGE_MIME_TO_EXTENSION,
  MAX_INPUT_PIXELS,
  WEBP_QUALITY,
  type AllowedImageMimeType,
} from './media.constants';

interface ImageInspection {
  width: number;
  height: number;
  mimeType: AllowedImageMimeType;
  originalExtension: string;
}

const ROTATED_ORIENTATIONS = new Set([5, 6, 7, 8]);

@Injectable()
export class MediaProcessingService {
  async inspectImage(file: Express.Multer.File): Promise<ImageInspection> {
    this.validateDeclaredMimeType(file);

    try {
      const metadata = await sharp(file.path, {
        limitInputPixels: MAX_INPUT_PIXELS,
      }).metadata();
      const detectedMimeType = metadata.format
        ? IMAGE_FORMAT_TO_MIME[metadata.format]
        : undefined;

      if (!detectedMimeType) {
        throw new UnsupportedMediaTypeException({
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Only JPEG, PNG, and WebP images are supported.',
        });
      }

      if (!metadata.width || !metadata.height) {
        throw new BadRequestException({
          code: 'INVALID_IMAGE',
          message: 'Image dimensions could not be read.',
        });
      }

      const pixelCount = metadata.width * metadata.height;

      if (pixelCount > MAX_INPUT_PIXELS) {
        throw new UnprocessableEntityException({
          code: 'IMAGE_TOO_LARGE',
          message: 'Image dimensions exceed 80 megapixels.',
        });
      }

      const shouldSwapDimensions = ROTATED_ORIENTATIONS.has(
        metadata.orientation ?? 1,
      );

      return {
        width: shouldSwapDimensions ? metadata.height : metadata.width,
        height: shouldSwapDimensions ? metadata.width : metadata.height,
        mimeType: detectedMimeType,
        originalExtension: IMAGE_MIME_TO_EXTENSION[detectedMimeType],
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException({
        code: 'INVALID_IMAGE',
        message: 'File is not a readable image.',
      });
    }
  }

  async createWebpVariant(
    sourcePath: string,
    outputPath: string,
    width: number,
  ): Promise<OutputInfo> {
    try {
      return await sharp(sourcePath, {
        limitInputPixels: MAX_INPUT_PIXELS,
      })
        .rotate()
        .resize({
          width,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: WEBP_QUALITY,
        })
        .toFile(outputPath);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException({
        code: 'INVALID_IMAGE',
        message: 'Image could not be processed.',
      });
    }
  }

  private validateDeclaredMimeType(file: Express.Multer.File): void {
    if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as never)) {
      return;
    }

    throw new UnsupportedMediaTypeException({
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'Only JPEG, PNG, and WebP images are supported.',
    });
  }
}
