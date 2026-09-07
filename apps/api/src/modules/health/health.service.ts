import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import type {
  DatabaseStatus,
  HealthResponse,
} from '../../common/types/api-status.type';

@Injectable()
export class HealthService {
  private readonly databaseStatuses: Record<number, DatabaseStatus> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  constructor(@InjectConnection() private readonly connection: Connection) {}

  getStatus(): HealthResponse {
    const database =
      this.databaseStatuses[this.connection.readyState] ?? 'unknown';
    const success = database === 'connected';

    return {
      success,
      status: success ? 'ok' : 'error',
      database,
    };
  }
}
