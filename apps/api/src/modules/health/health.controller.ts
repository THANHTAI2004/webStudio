import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { HealthResponse } from '../../common/types/api-status.type';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({
    description: 'The API and database are healthy.',
    schema: {
      example: {
        success: true,
        status: 'ok',
        database: 'connected',
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'The API is running, but the database is not connected.',
    schema: {
      example: {
        success: false,
        status: 'error',
        database: 'disconnected',
      },
    },
  })
  getHealth(@Res({ passthrough: true }) response: Response): HealthResponse {
    const health = this.healthService.getStatus();

    if (!health.success) {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return health;
  }
}
