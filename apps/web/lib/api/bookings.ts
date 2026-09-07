import { getApiBaseUrl } from "./client";

export interface BookingInput {
  customerName: string;
  phone: string;
  email?: string | null;
  packageId: string;
  shootDate: string;
  shootTime: string;
  peopleCount: number;
  location: string;
  customerNote?: string;
}

export interface PublicBooking {
  code: string;
  status: "new";
  package: {
    name: string;
    slug: string;
  };
  shootDate: string;
  shootTime: string;
}

interface BookingResponse {
  success: true;
  data: PublicBooking;
}

export class BookingApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = "BookingApiError";
  }
}

export async function createBooking(
  input: BookingInput,
): Promise<PublicBooking> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  } catch {
    throw new BookingApiError(
      0,
      null,
      "Kh\u00f4ng th\u1ec3 g\u1eedi y\u00eau c\u1ea7u l\u00fac n\u00e0y. Vui l\u00f2ng th\u1eed l\u1ea1i.",
    );
  }

  const payload = (await response.json().catch(() => null)) as
    BookingResponse | ErrorPayload | null;

  if (!response.ok) {
    throw new BookingApiError(
      response.status,
      getErrorCode(payload),
      getErrorMessage(payload),
    );
  }

  if (!payload || !("success" in payload) || !payload.success) {
    throw new BookingApiError(
      response.status,
      null,
      "Kh\u00f4ng th\u1ec3 g\u1eedi y\u00eau c\u1ea7u l\u00fac n\u00e0y. Vui l\u00f2ng th\u1eed l\u1ea1i.",
    );
  }

  return payload.data;
}

interface ErrorPayload {
  code?: unknown;
  message?: unknown;
}

function getErrorCode(
  payload: BookingResponse | ErrorPayload | null,
): string | null {
  if (!payload || !("code" in payload)) {
    return null;
  }

  return typeof payload.code === "string" ? payload.code : null;
}

function getErrorMessage(
  payload: BookingResponse | ErrorPayload | null,
): string {
  if (!payload || !("message" in payload)) {
    return "Kh\u00f4ng th\u1ec3 g\u1eedi y\u00eau c\u1ea7u l\u00fac n\u00e0y. Vui l\u00f2ng th\u1eed l\u1ea1i.";
  }

  if (Array.isArray(payload.message)) {
    return "Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i th\u00f4ng tin \u0111\u1eb7t l\u1ecbch.";
  }

  return typeof payload.message === "string"
    ? payload.message
    : "Kh\u00f4ng th\u1ec3 g\u1eedi y\u00eau c\u1ea7u l\u00fac n\u00e0y. Vui l\u00f2ng th\u1eed l\u1ea1i.";
}
