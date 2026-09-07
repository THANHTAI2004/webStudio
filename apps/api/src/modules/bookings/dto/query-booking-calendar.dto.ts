import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class QueryBookingCalendarDto {
  @ApiProperty({ example: '2026-09-01' })
  @IsString()
  @Matches(LOCAL_DATE_PATTERN)
  from: string;

  @ApiProperty({ example: '2026-09-30' })
  @IsString()
  @Matches(LOCAL_DATE_PATTERN)
  to: string;
}
