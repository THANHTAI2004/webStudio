import { getApiBaseUrl } from "./client";

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
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
  thumb: PublicMediaPreviewVariant;
  medium: PublicMediaPreviewVariant;
  large: PublicMediaPreviewVariant;
}

export interface PublicMediaPreviewVariant {
  url: string;
  width: number;
  height: number;
}

export interface PublicAlbumSeo {
  title: string;
  description: string;
  ogImage: PublicMediaPreview | null;
}

export interface PublicAlbumListItem {
  id: string;
  title: string;
  slug: string;
  category: CategorySummary | null;
  cover: PublicMediaPreview | null;
  description: string;
  shootingDate: string | null;
  location: string;
}

export interface PublicAlbumDetail extends PublicAlbumListItem {
  gallery: PublicGalleryImage[];
  content: string;
  seo: PublicAlbumSeo;
}

export interface AlbumPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AlbumListResponse {
  success: true;
  data: PublicAlbumListItem[];
  pagination: AlbumPagination;
}

interface AlbumDetailResponse {
  success: true;
  data: PublicAlbumDetail;
}

export async function getAlbums(params: {
  page?: number;
  limit?: number;
  category?: string;
  featured?: boolean;
  search?: string;
}, options?: {
  cache?: RequestCache;
}): Promise<AlbumListResponse | null> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.featured !== undefined) {
    searchParams.set("featured", String(params.featured));
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();
  const requestOptions = options?.cache
    ? { cache: options.cache }
    : {
        next: {
          revalidate: 60,
        },
      };
  const response = await fetch(
    `${getApiBaseUrl()}/albums${query ? `?${query}` : ""}`,
    requestOptions,
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json().catch(() => null)) as AlbumListResponse | null;
}

export async function getAlbumBySlug(
  slug: string,
): Promise<PublicAlbumDetail | null> {
  const response = await fetch(`${getApiBaseUrl()}/albums/${slug}`, {
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response
    .json()
    .catch(() => null)) as AlbumDetailResponse | null;

  return payload?.success ? payload.data : null;
}
