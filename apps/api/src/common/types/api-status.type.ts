export type ApiStatus = 'ok' | 'error';

export type DatabaseStatus =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'disconnecting'
  | 'unknown';

export interface HealthResponse {
  success: boolean;
  status: ApiStatus;
  database: DatabaseStatus;
}
