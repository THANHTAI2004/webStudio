import { MediaDocument } from '../../modules/media/schemas/media.schema';

export type MediaVariantName = 'thumb' | 'medium' | 'large';

export interface AdminMediaPreview {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  originalName: string;
}

export interface PublicMediaPreview {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface PublicGalleryImage {
  id: string;
  alt: string;
  thumb: PublicMediaVariant;
  medium: PublicMediaVariant;
  large: PublicMediaVariant;
}

export interface PublicMediaVariant {
  url: string;
  width: number;
  height: number;
}

export function toAdminMediaPreview(
  media: MediaDocument,
  variantName: MediaVariantName,
): AdminMediaPreview {
  const variant = media.variants[variantName];

  return {
    id: media._id.toString(),
    url: variant.url,
    width: variant.width,
    height: variant.height,
    alt: media.alt,
    originalName: media.originalName,
  };
}

export function toPublicMediaPreview(
  media: MediaDocument,
  variantName: MediaVariantName,
): PublicMediaPreview {
  const variant = media.variants[variantName];

  return {
    id: media._id.toString(),
    url: variant.url,
    width: variant.width,
    height: variant.height,
    alt: media.alt,
  };
}

export function toPublicGalleryImage(
  media: MediaDocument,
): PublicGalleryImage {
  return {
    id: media._id.toString(),
    alt: media.alt,
    thumb: toPublicMediaVariant(media, 'thumb'),
    medium: toPublicMediaVariant(media, 'medium'),
    large: toPublicMediaVariant(media, 'large'),
  };
}

function toPublicMediaVariant(
  media: MediaDocument,
  variantName: MediaVariantName,
): PublicMediaVariant {
  const variant = media.variants[variantName];

  return {
    url: variant.url,
    width: variant.width,
    height: variant.height,
  };
}

