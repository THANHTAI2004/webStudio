import { BadRequestException } from '@nestjs/common';

const EXTERNAL_URL_PATTERN = /^https?:\/\//i;
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

export function assertSafeExternalUrl(
  value: string,
  code = 'INVALID_URL',
): void {
  if (!value) {
    return;
  }

  try {
    const url = new URL(value);

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return;
    }
  } catch {
    // Fall through to the shared error.
  }

  throw new BadRequestException({
    code,
    message: 'URL must use http or https.',
  });
}

export function assertSafeCmsHref(
  value: string,
  code = 'INVALID_CTA_HREF',
): void {
  if (!value) {
    return;
  }

  if (value.startsWith('/') && !value.startsWith('//')) {
    return;
  }

  if (EXTERNAL_URL_PATTERN.test(value)) {
    assertSafeExternalUrl(value, code);
    return;
  }

  if (SCHEME_PATTERN.test(value)) {
    throw new BadRequestException({
      code,
      message: 'CTA href must be internal or use http/https.',
    });
  }

  throw new BadRequestException({
    code,
    message: 'CTA href must start with / or use http/https.',
  });
}

