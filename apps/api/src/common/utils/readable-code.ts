import { randomBytes } from 'node:crypto';

const DEFAULT_MAX_RETRIES = 8;

export async function createReadableCode(
  prefix: string,
  date: string,
  exists: (code: string) => Promise<boolean>,
  maxRetries = DEFAULT_MAX_RETRIES,
): Promise<string | null> {
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const code = `${prefix}-${date.replaceAll('-', '')}-${randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

    if (!(await exists(code))) {
      return code;
    }
  }

  return null;
}
