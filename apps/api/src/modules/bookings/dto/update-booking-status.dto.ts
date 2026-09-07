import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  BOOKING_STATUSES,
  type BookingStatus,
} from '../schemas/booking.schema';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BOOKING_STATUSES, example: 'contacted' })
  @IsEnum(BOOKING_STATUSES)
  status: BookingStatus;

  @ApiPropertyOptional({
    example: 'Da goi xac nhan voi khach',
    maxLength: 500,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
