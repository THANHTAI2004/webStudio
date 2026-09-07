import { API_BASE_URL, apiRequest } from './client';

export interface MediaVariant {
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface MediaItem {
  id: string;
  type: 'image';
  originalName: string;
  mimeType: string;
  originalSize: number;
  width: number;
  height: number;
  original: {
    url: string;
  };
  variants: {
    thumb: MediaVariant;
    small: MediaVariant;
    medium: MediaVariant;
    large: MediaVariant;
  };
  alt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaListResponse {
  success: true;
  data: MediaItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface MediaItemsResponse {
  success: true;
  data: MediaItem[];
}

interface MediaItemResponse {
  success: true;
  data: MediaItem;
}

interface SuccessResponse {
  success: true;
}

export function getMedia(params: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
} = {}): Promise<MediaListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.sort) {
    searchParams.set('sort', params.sort);
  }

  const query = searchParams.toString();

  return apiRequest<MediaListResponse>(
    `/admin/media${query ? `?${query}` : ''}`,
  );
}

export function uploadMedia(files: File[]): Promise<MediaItemsResponse> {
  const formData = new FormData();

  for (const file of files) {
    formData.append('files', file);
  }

  return apiRequest<MediaItemsResponse>('/admin/media/upload', {
    method: 'POST',
    body: formData,
  });
}

export function updateMedia(
  id: string,
  input: {
    alt: string;
  },
): Promise<MediaItemResponse> {
  return apiRequest<MediaItemResponse>(`/admin/media/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteMedia(id: string): Promise<SuccessResponse> {
  return apiRequest<SuccessResponse>(`/admin/media/${id}`, {
    method: 'DELETE',
  });
}

export function getMediaById(id: string): Promise<MediaItemResponse> {
  return apiRequest<MediaItemResponse>(`/admin/media/${id}`);
}

export function getMediaAssetUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const apiOrigin = new URL(API_BASE_URL).origin;
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;

  return `${apiOrigin}${normalizedPath}`;
}
