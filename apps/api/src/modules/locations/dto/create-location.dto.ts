import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { createSlug } from '../../../common/utils/slug';
import { LocationOpeningHourDto } from './location-opening-hour.dto';
import { LocationSeoDto } from './location-seo.dto';

function optionalSlug(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  return createSlug(value);
}

function optionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.trim();
}

function nullableEmail(value: unknown): string | null | undefined {
  if (value === null || value === '') {
    return null;
  }

  return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
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

function nullableUrl(value: unknown): string | null | undefined {
  if (value === null || value === '') {
    return null;
  }

  return typeof value === 'string' ? value.trim() || null : undefined;
}

function stringArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => (typeof item === 'string' ? item.trim() : item));
}

export class CreateLocationDto {
  @ApiProperty({ example: 'Studio Quan 1', maxLength: 160 })
  @Transform(({ value }) => optionalTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional({ example: 'studio-quan-1' })
  @Transform(({ value }) => optionalSlug(value))
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ maxLength: 3000 })
  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @ApiProperty({ maxLength: 500 })
  @Transform(({ value }) => optionalTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @ApiProperty({ maxLength: 50 })
  @Transform(({ value }) => optionalTrimmedString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => nullableEmail(value))
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ nullable: true, minimum: -90, maximum: 90 })
  @Transform(({ value }) => nullableNumber(value))
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: -180, maximum: 180 })
  @Transform(({ value }) => nullableNumber(value))
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @ApiPropertyOptional({ maxLength: 1000 })
  @Transform(({ value }) => nullableUrl(value))
  @IsOptional()
  @IsString()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(1000)
  mapUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => nullableObjectId(value))
  @IsOptional()
  @IsMongoId()
  coverMediaId?: string | null;

  @ApiPropertyOptional({ type: [String], maxItems: 30 })
  @Transform(({ value }) => stringArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsMongoId({ each: true })
  galleryMediaIds?: string[];

  @ApiPropertyOptional({ type: [LocationOpeningHourDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationOpeningHourDto)
  openingHours?: LocationOpeningHourDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ type: LocationSeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationSeoDto)
  seo?: LocationSeoDto;
}
