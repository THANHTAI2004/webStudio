import { apiRequest } from "./client";

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

export interface LocationMediaPreview {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  originalName: string;
}

export interface AdminLocation {
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
  coverMediaId: string | null;
  cover: LocationMediaPreview | null;
  galleryMediaIds: string[];
  gallery: LocationMediaPreview[];
  openingHours: LocationOpeningHour[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  seo: {
    title: string;
    description: string;
    ogImageMediaId: string | null;
    ogImage: LocationMediaPreview | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LocationInput {
  name: string;
  slug?: string;
  description?: string;
  address: string;
  phone: string;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string | null;
  coverMediaId?: string | null;
  galleryMediaIds?: string[];
  openingHours?: LocationOpeningHour[];
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  seo?: {
    title?: string;
    description?: string;
    ogImageMediaId?: string | null;
  };
}

interface LocationListResponse {
  success: true;
  data: AdminLocation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface LocationResponse {
  success: true;
  data: AdminLocation;
}

interface SuccessResponse {
  success: true;
}

export function getLocations(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean | "";
    featured?: boolean | "";
    sort?: string;
  } = {},
): Promise<LocationListResponse> {
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

  if (params.active !== undefined && params.active !== "") {
    searchParams.set("active", String(params.active));
  }

  if (params.featured !== undefined && params.featured !== "") {
    searchParams.set("featured", String(params.featured));
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  const query = searchParams.toString();

  return apiRequest<LocationListResponse>(
    `/admin/locations${query ? `?${query}` : ""}`,
  );
}

export function getLocationById(id: string): Promise<LocationResponse> {
  return apiRequest<LocationResponse>(`/admin/locations/${id}`);
}

export function createLocation(
  input: LocationInput,
): Promise<LocationResponse> {
  return apiRequest<LocationResponse>("/admin/locations", {
    method: "POST",
    body: input,
  });
}

export function updateLocation(
  id: string,
  input: LocationInput,
): Promise<LocationResponse> {
  return apiRequest<LocationResponse>(`/admin/locations/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteLocation(id: string): Promise<SuccessResponse> {
  return apiRequest<SuccessResponse>(`/admin/locations/${id}`, {
    method: "DELETE",
  });
}
