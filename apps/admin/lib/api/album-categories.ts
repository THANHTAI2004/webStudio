import { apiRequest } from "./client";

export interface AlbumCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryListResponse {
  success: true;
  data: AlbumCategory[];
}

interface CategoryResponse {
  success: true;
  data: AlbumCategory;
}

interface SuccessResponse {
  success: true;
}

export interface AlbumCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export function getAlbumCategories(): Promise<CategoryListResponse> {
  return apiRequest<CategoryListResponse>("/admin/album-categories");
}

export function createAlbumCategory(
  input: AlbumCategoryInput,
): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>("/admin/album-categories", {
    method: "POST",
    body: input,
  });
}

export function updateAlbumCategory(
  id: string,
  input: AlbumCategoryInput,
): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>(`/admin/album-categories/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteAlbumCategory(id: string): Promise<SuccessResponse> {
  return apiRequest<SuccessResponse>(`/admin/album-categories/${id}`, {
    method: "DELETE",
  });
}
