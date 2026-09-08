import { getApiBaseUrl } from "./client";

export interface ContactInput {
  customerName: string;
  phone: string;
  email?: string | null;
  subject: string;
  message: string;
  locationId?: string | null;
}

export interface PublicContact {
  code: string;
  status: "new";
}

interface ContactResponse {
  success: true;
  data: PublicContact;
}

export class ContactApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
  ) {
    super("Contact request failed");
    this.name = "ContactApiError";
  }
}

export async function createContact(
  input: ContactInput,
): Promise<PublicContact> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });
  } catch {
    throw new ContactApiError(0, null);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !isContactResponse(payload)) {
    throw new ContactApiError(response.status, getApiErrorCode(payload));
  }

  return payload.data;
}

function isContactResponse(value: unknown): value is ContactResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<ContactResponse>;

  return payload.success === true && Boolean(payload.data?.code);
}

function getApiErrorCode(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const code = (payload as { code?: unknown }).code;

  return typeof code === "string" ? code : null;
}
