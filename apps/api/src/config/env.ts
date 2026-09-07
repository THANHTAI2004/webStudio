export const API_GLOBAL_PREFIX = 'api/v1';
export const DEFAULT_API_PORT = 4000;
export const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
] as const;

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
