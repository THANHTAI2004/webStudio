import { apiRequest } from "./client";

export type PackageStatus = "draft" | "published" | "hidden";

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface PackageMediaPreview {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  originalName: string;
}

export interface AdminPackage {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  category: CategorySummary | null;
  thumbnailMediaId: string | null;
  thumbnail: PackageMediaPreview | null;
  galleryMediaIds: string[];
  gallery: PackageMediaPreview[];
  price: number;
  salePrice: number | null;
  durationMinutes: number | null;
  features: string[];
  description: string;
  content: string;
  status: PackageStatus;
  isFeatured: boolean;
  sortOrder: number;
  seo: {
    title: string;
    description: string;
    ogImageMediaId: string | null;
    ogImage: PackageMediaPreview | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PackageInput {
  name: string;
  slug?: string;
  categoryId: string;
  thumbnailMediaId?: string | null;
  galleryMediaIds?: string[];
  price: number;
  salePrice?: number | null;
  durationMinutes?: number | null;
  features?: string[];
  description?: string;
  content?: string;
  status?: PackageStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  seo?: {
    title?: string;
    description?: string;
    ogImageMediaId?: string | null;
  };
}

interface PackageListResponse {
  success: true;
  data: AdminPackage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PackageResponse {
  success: true;
  data: AdminPackage;
}

interface SuccessResponse {
  success: true;
}

export function getPackages(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: PackageStatus | "";
    isFeatured?: boolean;
    sort?: string;
  } = {},
): Promise<PackageListResponse> {
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

  return apiRequest<PackageListResponse>(
    `/admin/packages${query ? `?${query}` : ""}`,
  );
}

export function getPackageById(id: string): Promise<PackageResponse> {
  return apiRequest<PackageResponse>(`/admin/packages/${id}`);
}

export function createPackage(input: PackageInput): Promise<PackageResponse> {
  return apiRequest<PackageResponse>("/admin/packages", {
    method: "POST",
    body: input,
  });
}

export function updatePackage(
  id: string,
  input: PackageInput,
): Promise<PackageResponse> {
  return apiRequest<PackageResponse>(`/admin/packages/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deletePackage(id: string): Promise<SuccessResponse> {
  return apiRequest<SuccessResponse>(`/admin/packages/${id}`, {
    method: "DELETE",
  });
}
