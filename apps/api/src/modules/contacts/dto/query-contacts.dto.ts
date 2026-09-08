import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  CONTACT_STATUSES,
  type ContactStatus,
} from '../schemas/contact.schema';

export class QueryContactsDto {
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

  @ApiPropertyOptional({ enum: CONTACT_STATUSES })
  @IsOptional()
  @IsEnum(CONTACT_STATUSES)
  status?: ContactStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Date or ISO timestamp.' })
  @IsOptional()
  @IsString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Date or ISO timestamp.' })
  @IsOptional()
  @IsString()
  createdTo?: string;

  @ApiPropertyOptional({
    enum: ['createdAt:desc', 'createdAt:asc', 'updatedAt:desc'],
    default: 'createdAt:desc',
  })
  @IsOptional()
  @IsIn(['createdAt:desc', 'createdAt:asc', 'updatedAt:desc'])
  sort?: string;
}
