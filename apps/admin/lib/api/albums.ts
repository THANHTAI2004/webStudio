import { apiRequest } from "./client";

export type AlbumStatus = "draft" | "published" | "hidden";

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface AlbumMediaPreview {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  originalName: string;
}

export interface AdminAlbum {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  category: CategorySummary | null;
  coverMediaId: string | null;
  cover: AlbumMediaPreview | null;
  galleryMediaIds: string[];
  gallery: AlbumMediaPreview[];
  description: string;
  content: string;
  shootingDate: string | null;
  location: string;
  status: AlbumStatus;
  isFeatured: boolean;
  sortOrder: number;
  seo: {
    title: string;
    description: string;
    ogImageMediaId: string | null;
    ogImage: AlbumMediaPreview | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AlbumInput {
  title: string;
  slug?: string;
  categoryId: string;
  coverMediaId?: string | null;
  galleryMediaIds?: string[];
  description?: string;
  content?: string;
  shootingDate?: string | null;
  location?: string;
  status?: AlbumStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  seo?: {
    title?: string;
    description?: string;
    ogImageMediaId?: string | null;
  };
}

interface AlbumListResponse {
  success: true;
  data: AdminAlbum[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AlbumResponse {
  success: true;
  data: AdminAlbum;
}

interface SuccessResponse {
  success: true;
}

export function getAlbums(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: AlbumStatus | "";
    isFeatured?: boolean;
    sort?: string;
  } = {},
): Promise<AlbumListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.categoryId) {
    searchParams.set("categoryId", params.categoryId);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.isFeatured !== undefined) {
    searchParams.set("isFeatured", String(params.isFeatured));
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  const query = searchParams.toString();

  return apiRequest<AlbumListResponse>(
    `/admin/albums${query ? `?${query}` : ""}`,
  );
}

export function getAlbumById(id: string): Promise<AlbumResponse> {
  return apiRequest<AlbumResponse>(`/admin/albums/${id}`);
}

export function createAlbum(input: AlbumInput): Promise<AlbumResponse> {
  return apiRequest<AlbumResponse>("/admin/albums", {
    method: "POST",
    body: input,
  });
}

export function updateAlbum(
  id: string,
  input: AlbumInput,
): Promise<AlbumResponse> {
  return apiRequest<AlbumResponse>(`/admin/albums/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteAlbum(id: string): Promise<SuccessResponse> {
  return apiRequest<SuccessResponse>(`/admin/albums/${id}`, {
    method: "DELETE",
  });
}
