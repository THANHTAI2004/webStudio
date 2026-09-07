import { apiRequest } from "./client";

export interface PackageCategory {
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
  data: PackageCategory[];
}

interface CategoryResponse {
  success: true;
  data: PackageCategory;
}

interface SuccessResponse {
  success: true;
}

export interface PackageCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export function getPackageCategories(): Promise<CategoryListResponse> {
  return apiRequest<CategoryListResponse>("/admin/package-categories");
}

export function createPackageCategory(
  input: PackageCategoryInput,
): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>("/admin/package-categories", {
    method: "POST",
    body: input,
  });
}

export function updatePackageCategory(
  id: string,
  input: PackageCategoryInput,
): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>(`/admin/package-categories/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deletePackageCategory(id: string): Promise<SuccessResponse> {
  return apiRequest<SuccessResponse>(`/admin/package-categories/${id}`, {
    method: "DELETE",
  });
}
