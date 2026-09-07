import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

const TEMP_UPLOAD_DIRECTORY_NAME = '.tmp';

export async function ensureUploadDirectories(uploadRoot: string): Promise<void> {
  await fs.mkdir(uploadRoot, { recursive: true });
  await fs.mkdir(getTempUploadRoot(uploadRoot), { recursive: true });
}

export function ensureUploadDirectoriesSync(uploadRoot: string): void {
  fsSync.mkdirSync(uploadRoot, { recursive: true });
  fsSync.mkdirSync(getTempUploadRoot(uploadRoot), { recursive: true });
}

export function getTempUploadRoot(uploadRoot: string): string {
  return path.join(uploadRoot, TEMP_UPLOAD_DIRECTORY_NAME);
}

export function toStoragePath(relativePath: string): string {
  return relativePath.split(path.sep).join('/');
}

export function toFilesystemPath(uploadRoot: string, relativePath: string): string {
  const safeRelativePath = relativePath.replaceAll('/', path.sep);
  const resolvedPath = path.resolve(uploadRoot, safeRelativePath);
  const relativeToRoot = path.relative(uploadRoot, resolvedPath);

  if (
    relativeToRoot === '' ||
    relativeToRoot.startsWith('..') ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new Error('Resolved media path must stay inside UPLOAD_DIR.');
  }

  return resolvedPath;
}

export function isPathInside(parentPath: string, childPath: string): boolean {
  const relativePath = path.relative(parentPath, childPath);

  return (
    relativePath !== '' &&
    !relativePath.startsWith('..') &&
    !path.isAbsolute(relativePath)
  );
}
