import { Injectable } from '@nestjs/common';

interface Bucket {
  count: number;
  expiresAt: number;
}

@Injectable()
export class BookingRateLimitService {
  private readonly buckets = new Map<string, Bucket>();

  consume(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.expiresAt <= now) {
      this.buckets.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      this.prune(now);

      return true;
    }

    if (bucket.count >= limit) {
      return false;
    }

    bucket.count += 1;

    return true;
  }

  clear(): void {
    this.buckets.clear();
  }

  private prune(now: number): void {
    if (this.buckets.size < 1000) {
      return;
    }

    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.expiresAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}
