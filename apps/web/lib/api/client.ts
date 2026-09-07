const DEFAULT_API_INTERNAL_URL = 'http://localhost:4000/api/v1';

export interface HealthResponse {
  success: boolean;
  status: string;
  database: string;
}

function getApiBaseUrl(): string {
  return (process.env.API_INTERNAL_URL ?? DEFAULT_API_INTERNAL_URL).replace(
    /\/+$/,
    '',
  );
}

function isHealthResponse(value: unknown): value is HealthResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const response = value as Record<string, unknown>;

  return (
    typeof response.success === 'boolean' &&
    typeof response.status === 'string' &&
    typeof response.database === 'string'
  );
}

export async function getHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/health`, {
      cache: 'no-store',
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
