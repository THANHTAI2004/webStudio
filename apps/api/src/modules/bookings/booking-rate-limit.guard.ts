import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { BookingRateLimitService } from './booking-rate-limit.service';

const BOOKING_RATE_LIMIT = 5;
const BOOKING_RATE_WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class BookingRateLimitGuard implements CanActivate {
  constructor(
    private readonly bookingRateLimitService: BookingRateLimitService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = getClientKey(request);
    const allowed = this.bookingRateLimitService.consume(
      key,
      BOOKING_RATE_LIMIT,
      BOOKING_RATE_WINDOW_MS,
    );

    if (!allowed) {
      throw new HttpException(
        {
          code: 'BOOKING_RATE_LIMITED',
          message: 'Too many booking requests. Please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}

function getClientKey(request: Request): string {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]?.trim()) {
    return forwardedFor[0].trim();
  }

  return request.ip ?? request.socket.remoteAddress ?? 'unknown';
}
