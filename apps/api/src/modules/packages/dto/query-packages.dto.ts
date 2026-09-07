import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
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
  PACKAGE_STATUSES,
  type PackageStatus,
} from '../schemas/package.schema';

function optionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return undefined;
}

export class QueryPackagesDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ enum: PACKAGE_STATUSES })
  @IsOptional()
  @IsEnum(PACKAGE_STATUSES)
  status?: PackageStatus;

  @ApiPropertyOptional()
  @Transform(({ value }) => optionalBoolean(value))
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    enum: [
      'createdAt:desc',
      'createdAt:asc',
      'price:asc',
      'price:desc',
      'sortOrder:asc',
    ],
    default: 'createdAt:desc',
  })
  @IsOptional()
  @IsIn([
    'createdAt:desc',
    'createdAt:asc',
    'price:asc',
    'price:desc',
    'sortOrder:asc',
  ])
  sort?: string;
}
