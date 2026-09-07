import { apiRequest } from "./client";

export interface PostCategory {
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
  data: PostCategory[];
}

interface CategoryResponse {
  success: true;
  data: PostCategory;
}

interface SuccessResponse {
  success: true;
}

export interface PostCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export function getPostCategories(): Promise<CategoryListResponse> {
  return apiRequest<CategoryListResponse>("/admin/post-categories");
}

export function createPostCategory(
  input: PostCategoryInput,
): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>("/admin/post-categories", {
    method: "POST",
    body: input,
  });
}

export function updatePostCategory(
  id: string,
  input: PostCategoryInput,
): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>(`/admin/post-categories/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deletePostCategory(id: string): Promise<SuccessResponse> {
  return apiRequest<SuccessResponse>(`/admin/post-categories/${id}`, {
    method: "DELETE",
  });
}
