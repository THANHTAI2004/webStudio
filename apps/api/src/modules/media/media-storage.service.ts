import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  normalizeMediaUrlPrefix,
  resolveUploadRoot,
} from '../../config/env';
import {
  ensureUploadDirectories,
  getTempUploadRoot,
  isPathInside,
  toFilesystemPath,
  toStoragePath,
} from './media-storage.paths';

@Injectable()
export class MediaStorageService {
  private readonly uploadRoot: string;
  private readonly tempUploadRoot: string;
  private readonly mediaUrlPrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadRoot = resolveUploadRoot(
      this.configService.get<string>('UPLOAD_DIR'),
    );
    this.tempUploadRoot = getTempUploadRoot(this.uploadRoot);
    this.mediaUrlPrefix = normalizeMediaUrlPrefix(
      this.configService.get<string>('MEDIA_URL_PREFIX'),
    );
  }

  async ensureInitialized(): Promise<void> {
    await ensureUploadDirectories(this.uploadRoot);
  }

  getUploadRoot(): string {
    return this.uploadRoot;
  }

  getTempUploadRoot(): string {
    return this.tempUploadRoot;
  }

  async createMediaDirectory(date = new Date()): Promise<string> {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const directory = toStoragePath(path.join(year, month, randomUUID()));

    await fs.mkdir(this.resolveFinalPath(directory), { recursive: true });

    return directory;
  }

  resolveFinalPath(relativePath: string): string {
    return toFilesystemPath(this.uploadRoot, relativePath);
  }

  toPublicUrl(relativePath: string): string {
    return `${this.mediaUrlPrefix}/${toStoragePath(relativePath)}`;
  }

  async moveTempFile(tempPath: string, finalRelativePath: string): Promise<void> {
    const resolvedTempPath = path.resolve(tempPath);

    if (!isPathInside(this.tempUploadRoot, resolvedTempPath)) {
      throw new Error('Temp upload path must stay inside the temp directory.');
    }

    const finalPath = this.resolveFinalPath(finalRelativePath);

    await fs.mkdir(path.dirname(finalPath), { recursive: true });
    await fs.rename(resolvedTempPath, finalPath);
  }

  async deleteMediaDirectory(directory: string): Promise<void> {
    const directoryPath = this.resolveFinalPath(directory);

    await removePathWithRetry(directoryPath);
  }

  async cleanupTempFiles(files: Express.Multer.File[]): Promise<void> {
    await Promise.all(
      files.map(async (file) => {
        if (!file.path) {
          return;
        }

        const resolvedPath = path.resolve(file.path);

        if (!isPathInside(this.tempUploadRoot, resolvedPath)) {
          return;
        }

        await fs.unlink(resolvedPath).catch((error: unknown) => {
          if (isMissingFileError(error)) {
            return;
          }

          throw error;
        });
      }),
    );
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

function isRetryableFilesystemError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  const code = (error as NodeJS.ErrnoException).code;

  return code === 'EBUSY' || code === 'ENOTEMPTY' || code === 'EPERM';
}

async function removePathWithRetry(targetPath: string): Promise<void> {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await fs.rm(targetPath, {
        recursive: true,
        force: true,
      });
      return;
    } catch (error) {
      if (!isRetryableFilesystemError(error) || attempt === maxAttempts) {
        throw error;
      }

      await sleep(attempt * 75);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
