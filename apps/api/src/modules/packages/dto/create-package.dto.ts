import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { createSlug } from '../../../common/utils/slug';
import {
  PACKAGE_STATUSES,
  type PackageStatus,
} from '../schemas/package.schema';
import { PackageSeoDto } from './package-seo.dto';

function optionalSlug(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  return createSlug(value);
}

function nullableObjectId(value: unknown): string | null | undefined {
  if (value === null || value === '') {
    return null;
  }

  return typeof value === 'string' ? value : undefined;
}

function nullableNumber(value: unknown): number | null | undefined {
  if (value === null || value === '') {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  return Number(value);
}

function stringArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => (typeof item === 'string' ? item.trim() : item));
}

export class CreatePackageDto {
  @ApiProperty({
    example: 'Wedding Premium',
    maxLength: 200,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    example: 'wedding-premium',
  })
  @Transform(({ value }) => optionalSlug(value))
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty()
  @IsMongoId()
  categoryId: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @Transform(({ value }) => nullableObjectId(value))
  @IsOptional()
  @IsMongoId()
  thumbnailMediaId?: string | null;

  @ApiPropertyOptional({
    type: [String],
    maxItems: 30,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsMongoId({ each: true })
  galleryMediaIds?: string[];

  @ApiProperty({
    minimum: 0,
    example: 9900000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    nullable: true,
    minimum: 0,
  })
  @Transform(({ value }) => nullableNumber(value))
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    minimum: 1,
  })
  @Transform(({ value }) => nullableNumber(value))
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMinutes?: number | null;

  @ApiPropertyOptional({
    type: [String],
    maxItems: 30,
  })
  @Transform(({ value }) => stringArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    default: '',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    default: '',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    enum: PACKAGE_STATUSES,
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(PACKAGE_STATUSES)
  status?: PackageStatus;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    type: PackageSeoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PackageSeoDto)
  seo?: PackageSeoDto;
}
