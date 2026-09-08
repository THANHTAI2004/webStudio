import type { Request } from 'express';

export function getHttpClientKey(request: Request): string {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]?.trim()) {
    return forwardedFor[0].trim();
  }

  return request.ip ?? request.socket.remoteAddress ?? 'unknown';
}
