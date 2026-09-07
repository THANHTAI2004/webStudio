const DEFAULT_API_INTERNAL_URL = "http://localhost:4000/api/v1";

export interface HealthResponse {
  success: boolean;
  status: string;
  database: string;
}

export function getApiBaseUrl(): string {
  return (process.env.API_INTERNAL_URL ?? DEFAULT_API_INTERNAL_URL).replace(
    /\/+$/,
    "",
  );
}

export function getPublicApiOrigin(): string {
  const browserApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const baseUrl = browserApiUrl?.trim() ? browserApiUrl : getApiBaseUrl();

  return new URL(baseUrl).origin;
}

export function getMediaAssetUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  return `${getPublicApiOrigin()}${normalizedPath}`;
}

function isHealthResponse(value: unknown): value is HealthResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Record<string, unknown>;

  return (
    typeof response.success === "boolean" &&
    typeof response.status === "string" &&
    typeof response.database === "string"
  );
}

export async function getHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/health`, {
      cache: "no-store",
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!isHealthResponse(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
