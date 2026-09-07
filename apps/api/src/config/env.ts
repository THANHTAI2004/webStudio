import path from 'node:path';
import type { SignOptions } from 'jsonwebtoken';

export const API_GLOBAL_PREFIX = 'api/v1';
export const DEFAULT_API_PORT = 4000;
export const DEFAULT_UPLOAD_DIR = '../../data/uploads';
export const DEFAULT_MEDIA_URL_PREFIX = '/uploads';
export const DEFAULT_MAX_UPLOAD_MB = 25;
export const DEFAULT_MAX_UPLOAD_FILES = 20;
export const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
] as const;
export const DEFAULT_JWT_ACCESS_TTL = '15m';
export const DEFAULT_JWT_REFRESH_TTL = '30d';

export type JwtTtl = NonNullable<SignOptions['expiresIn']>;

const DURATION_PATTERN = /^(\d+)\s*(ms|s|m|h|d|w|y)$/i;
const DURATION_MULTIPLIERS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  y: 365 * 24 * 60 * 60 * 1000,
};

const ONE_MEGABYTE = 1024 * 1024;

export function parsePort(value?: string): number {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return DEFAULT_API_PORT;
}

export function parseCorsOrigins(value?: string): string[] {
  const origins =
    value
      ?.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0 && origin !== '*') ?? [];

  return origins.length > 0 ? origins : [...DEFAULT_CORS_ORIGINS];
}

export function requireConfigValue(value: string | undefined, key: string): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    throw new Error(`${key} is required to start the Studio API.`);
  }

  return trimmedValue;
}

export function readJwtTtl(
  value: string | undefined,
  fallback: string,
  key: string,
): JwtTtl {
  const ttl = value?.trim() || fallback;

  if (!DURATION_PATTERN.test(ttl)) {
    throw new Error(`${key} must use a duration like 15m or 30d.`);
  }

  return ttl as JwtTtl;
}

export function parseDurationMs(value: JwtTtl): number {
  if (typeof value === 'number') {
    return value * 1000;
  }

  const match = DURATION_PATTERN.exec(value);

  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  return amount * DURATION_MULTIPLIERS[unit];
}

export function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  key: string,
): number {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  throw new Error(`${key} must be a positive integer.`);
}

export function parseUploadMaxBytes(value?: string): number {
  return (
    parsePositiveInteger(value, DEFAULT_MAX_UPLOAD_MB, 'MAX_UPLOAD_MB') *
    ONE_MEGABYTE
  );
}

export function parseUploadMaxFiles(value?: string): number {
  return parsePositiveInteger(
    value,
    DEFAULT_MAX_UPLOAD_FILES,
    'MAX_UPLOAD_FILES',
  );
}

export function resolveUploadRoot(uploadDir?: string): string {
  const configuredUploadDir = uploadDir?.trim() || DEFAULT_UPLOAD_DIR;

  if (path.isAbsolute(configuredUploadDir)) {
    return path.resolve(configuredUploadDir);
  }

  return path.resolve(process.cwd(), configuredUploadDir);
}

export function normalizeMediaUrlPrefix(value?: string): string {
  const prefix = value?.trim() || DEFAULT_MEDIA_URL_PREFIX;
  const prefixed = prefix.startsWith('/') ? prefix : `/${prefix}`;

  return prefixed.replace(/\/+$/, '') || DEFAULT_MEDIA_URL_PREFIX;
}
