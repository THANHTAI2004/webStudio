import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, Matches } from 'class-validator';
import {
  LOCATION_WEEKDAYS,
  type LocationWeekday,
} from '../schemas/location.schema';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function nullableTime(value: unknown): string | null | undefined {
  if (value === null || value === '') {
    return null;
  }

  return typeof value === 'string' ? value.trim() : undefined;
}

export class LocationOpeningHourDto {
  @ApiProperty({ enum: LOCATION_WEEKDAYS, example: 'monday' })
  @IsEnum(LOCATION_WEEKDAYS)
  day: LocationWeekday;

  @ApiProperty({ default: false })
  @IsBoolean()
  isClosed: boolean;

  @ApiPropertyOptional({ nullable: true, example: '08:00' })
  @Transform(({ value }) => nullableTime(value))
  @IsOptional()
  @Matches(TIME_PATTERN)
  openTime?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '18:30' })
  @Transform(({ value }) => nullableTime(value))
  @IsOptional()
  @Matches(TIME_PATTERN)
  closeTime?: string | null;
}
