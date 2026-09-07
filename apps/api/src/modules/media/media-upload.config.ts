import { randomUUID } from 'node:crypto';
import {
  UnsupportedMediaTypeException,
  type HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import multer from 'multer';
import {
  parseUploadMaxBytes,
  parseUploadMaxFiles,
  resolveUploadRoot,
} from '../../config/env';
import { ALLOWED_IMAGE_MIME_TYPES } from './media.constants';
import {
  ensureUploadDirectoriesSync,
  getTempUploadRoot,
} from './media-storage.paths';

export function createMulterOptions(
  configService: ConfigService,
): MulterOptions {
  const uploadRoot = resolveUploadRoot(configService.get<string>('UPLOAD_DIR'));
  const tempUploadRoot = getTempUploadRoot(uploadRoot);

  ensureUploadDirectoriesSync(uploadRoot);

  return {
    storage: multer.diskStorage({
      destination: tempUploadRoot,
      filename: (_request, _file, callback) => {
        callback(null, `${randomUUID()}.upload`);
      },
    }),
    limits: {
      fileSize: parseUploadMaxBytes(configService.get<string>('MAX_UPLOAD_MB')),
      files: parseUploadMaxFiles(configService.get<string>('MAX_UPLOAD_FILES')),
    },
    fileFilter: (_request, file, callback) => {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as never)) {
        callback(createUnsupportedMediaTypeException(), false);
        return;
      }

      callback(null, true);
    },
  };
}

function createUnsupportedMediaTypeException(): HttpException {
  return new UnsupportedMediaTypeException({
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'Only JPEG, PNG, and WebP images are supported.',
  });
}
