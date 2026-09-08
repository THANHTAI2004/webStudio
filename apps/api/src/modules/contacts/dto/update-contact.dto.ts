import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  CONTACT_STATUSES,
  type ContactStatus,
} from '../schemas/contact.schema';

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

export class UpdateContactDto {
  @ApiPropertyOptional({ enum: CONTACT_STATUSES })
  @IsOptional()
  @IsEnum(CONTACT_STATUSES)
  status?: ContactStatus;

  @ApiPropertyOptional({ maxLength: 5000 })
  @Transform(({ value }) => optionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  adminNote?: string;
}
