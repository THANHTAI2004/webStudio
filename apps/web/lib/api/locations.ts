import { getApiBaseUrl } from "./client";

export type LocationWeekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface LocationOpeningHour {
  day: LocationWeekday;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
}

export interface PublicLocationMediaPreview {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface PublicLocationGalleryVariant {
  url: string;
  width: number;
  height: number;
}

export interface PublicLocationGalleryImage {
  id: string;
  alt: string;
  thumb: PublicLocationGalleryVariant;
  medium: PublicLocationGalleryVariant;
  large: PublicLocationGalleryVariant;
}

export interface PublicLocationSeo {
  title: string;
  description: string;
  ogImage: PublicLocationMediaPreview | null;
}

export interface PublicLocationListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  email: string | null;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  mapUrl: string;
  cover: PublicLocationMediaPreview | null;
  openingHours: LocationOpeningHour[];
  featured: boolean;
}

export interface PublicLocationDetail extends PublicLocationListItem {
  gallery: PublicLocationGalleryImage[];
  seo: PublicLocationSeo;
}

interface LocationListResponse {
  success: true;
  data: PublicLocationListItem[];
}

interface LocationDetailResponse {
  success: true;
  data: PublicLocationDetail;
}

interface LocationRequestOptions {
  cache?: RequestCache;
  revalidate?: number;
}

export async function getLocations(
  options: LocationRequestOptions = {},
): Promise<PublicLocationListItem[]> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/locations`, {
      ...getFetchCacheOptions(options),
    });
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const payload = (await response
    .json()
    .catch(() => null)) as LocationListResponse | null;

  return payload?.success ? payload.data : [];
}

export async function getLocationBySlug(
  slug: string,
): Promise<PublicLocationDetail | null> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/locations/${slug}`, {
      next: {
        revalidate: 60,
      },
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const payload = (await response
    .json()
    .catch(() => null)) as LocationDetailResponse | null;

  return payload?.success ? payload.data : null;
}

function getFetchCacheOptions(options: LocationRequestOptions):
  | { cache: RequestCache }
  | { next: { revalidate: number } } {
  if (options.cache) {
    return { cache: options.cache };
  }

  return {
    next: {
      revalidate: options.revalidate ?? 60,
    },
  };
}
