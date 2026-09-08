import { apiRequest } from "./client";

export type ContactStatus = "new" | "read" | "replied" | "archived";

export interface ContactLocationSummary {
  id: string;
  name: string;
  slug: string;
  address: string;
}

export interface AdminContactListItem {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  email: string | null;
  subject: string;
  location: ContactLocationSummary | null;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContactDetail extends AdminContactListItem {
  message: string;
  locationId: string | null;
  adminNote: string;
  source: "website";
}

interface ContactListResponse {
  success: true;
  data: AdminContactListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ContactResponse {
  success: true;
  data: AdminContactDetail;
}

export function getContacts(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ContactStatus | "";
    locationId?: string;
    createdFrom?: string;
    createdTo?: string;
    sort?: string;
  } = {},
): Promise<ContactListResponse> {
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

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.locationId) {
    searchParams.set("locationId", params.locationId);
  }

  if (params.createdFrom) {
    searchParams.set("createdFrom", params.createdFrom);
  }

  if (params.createdTo) {
    searchParams.set("createdTo", params.createdTo);
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  const query = searchParams.toString();

  return apiRequest<ContactListResponse>(
    `/admin/contacts${query ? `?${query}` : ""}`,
  );
}

export function getContact(id: string): Promise<ContactResponse> {
  return apiRequest<ContactResponse>(`/admin/contacts/${id}`);
}

export function updateContact(
  id: string,
  input: {
    status?: ContactStatus;
    adminNote?: string;
  },
): Promise<ContactResponse> {
  return apiRequest<ContactResponse>(`/admin/contacts/${id}`, {
    method: "PATCH",
    body: input,
  });
}
