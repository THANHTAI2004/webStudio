import { Module } from '@nestjs/common';
import { InMemoryRateLimitService } from './in-memory-rate-limit.service';

@Module({
  providers: [InMemoryRateLimitService],
  exports: [InMemoryRateLimitService],
})
export class RateLimitModule {}
