import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  BOOKING_STATUSES,
  type BookingStatus,
} from '../schemas/booking.schema';

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class QueryBookingsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: BOOKING_STATUSES })
  @IsOptional()
  @IsEnum(BOOKING_STATUSES)
  status?: BookingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  packageId?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @Matches(LOCAL_DATE_PATTERN)
  shootDateFrom?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @Matches(LOCAL_DATE_PATTERN)
  shootDateTo?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  createdFrom?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsString()
  createdTo?: string;

  @ApiPropertyOptional({
    enum: [
      'createdAt:desc',
      'createdAt:asc',
      'shootDate:asc',
      'shootDate:desc',
      'updatedAt:desc',
    ],
    default: 'createdAt:desc',
  })
  @IsOptional()
  @IsIn([
    'createdAt:desc',
    'createdAt:asc',
    'shootDate:asc',
    'shootDate:desc',
    'updatedAt:desc',
  ])
  sort?: string;
}
