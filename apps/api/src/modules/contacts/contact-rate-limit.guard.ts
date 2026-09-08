import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { getHttpClientKey } from '../../common/rate-limit/http-client-key';
import { InMemoryRateLimitService } from '../../common/rate-limit/in-memory-rate-limit.service';

const CONTACT_RATE_LIMIT = 5;
const CONTACT_RATE_WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class ContactRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: InMemoryRateLimitService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const allowed = this.rateLimitService.consume(
      `contact:${getHttpClientKey(request)}`,
      CONTACT_RATE_LIMIT,
      CONTACT_RATE_WINDOW_MS,
    );

    if (!allowed) {
      throw new HttpException(
        {
          code: 'CONTACT_RATE_LIMITED',
          message: 'Too many contact requests. Please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
