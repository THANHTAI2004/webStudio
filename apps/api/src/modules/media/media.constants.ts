export const MEDIA_URL_PREFIX = '/uploads';
export const MEDIA_TYPE_IMAGE = 'image' as const;
export const MAX_INPUT_PIXELS = 80_000_000;
export const WEBP_QUALITY = 82;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const IMAGE_VARIANTS = {
  thumb: 400,
  small: 768,
  medium: 1280,
  large: 1920,
} as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
export type ImageVariantName = keyof typeof IMAGE_VARIANTS;

export const IMAGE_FORMAT_TO_MIME: Record<string, AllowedImageMimeType> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const IMAGE_MIME_TO_EXTENSION: Record<AllowedImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
