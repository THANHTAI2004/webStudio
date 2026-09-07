import { apiRequest } from "./client";

export type BookingStatus =
  | "new"
  | "contacted"
  | "confirmed"
  | "deposit"
  | "shooting"
  | "completed"
  | "cancelled";

export interface BookingPackageSummary {
  id: string;
  name: string;
  slug: string;
}

export interface BookingPackageSnapshot {
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
}

export interface AdminBookingListItem {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  email: string | null;
  package: BookingPackageSummary;
  shootDate: string;
  shootTime: string;
  location: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBookingDetail extends AdminBookingListItem {
  packageId: string;
  packageSnapshot: BookingPackageSnapshot;
  peopleCount: number;
  customerNote: string;
  adminNote: string;
  statusHistory: {
    status: BookingStatus;
    changedAt: string;
    changedByAdminId: string | null;
    note: string;
    admin: {
      id: string;
      name: string;
    } | null;
  }[];
  source: "website";
  allowedTransitions: BookingStatus[];
}

export interface AdminBookingCalendarItem {
  id: string;
  code: string;
  customerName: string;
  package: BookingPackageSummary;
  shootDate: string;
  shootTime: string;
  status: BookingStatus;
}

export interface BookingInput {
  customerName?: string;
  phone?: string;
  email?: string | null;
  packageId?: string;
  shootDate?: string;
  shootTime?: string;
  peopleCount?: number;
  location?: string;
  customerNote?: string;
  adminNote?: string;
}

interface BookingListResponse {
  success: true;
  data: AdminBookingListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface BookingDetailResponse {
  success: true;
  data: AdminBookingDetail;
}

interface BookingCalendarResponse {
  success: true;
  data: AdminBookingCalendarItem[];
}

export function getBookings(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: BookingStatus | "";
    packageId?: string;
    shootDateFrom?: string;
    shootDateTo?: string;
    createdFrom?: string;
    createdTo?: string;
    sort?: string;
  } = {},
): Promise<BookingListResponse> {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();

  return apiRequest<BookingListResponse>(
    `/admin/bookings${query ? `?${query}` : ""}`,
  );
}

export function getBooking(id: string): Promise<BookingDetailResponse> {
  return apiRequest<BookingDetailResponse>(`/admin/bookings/${id}`);
}

export function getBookingCalendar(params: {
  from: string;
  to: string;
}): Promise<BookingCalendarResponse> {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  });

  return apiRequest<BookingCalendarResponse>(
    `/admin/bookings/calendar?${searchParams.toString()}`,
  );
}

export function updateBooking(
  id: string,
  input: BookingInput,
): Promise<BookingDetailResponse> {
  return apiRequest<BookingDetailResponse>(`/admin/bookings/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function updateBookingStatus(
  id: string,
  input: {
    status: BookingStatus;
    note?: string;
  },
): Promise<BookingDetailResponse> {
  return apiRequest<BookingDetailResponse>(`/admin/bookings/${id}/status`, {
    method: "PATCH",
    body: input,
  });
}
