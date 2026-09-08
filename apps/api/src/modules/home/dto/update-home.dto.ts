import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  HOME_FEATURED_MODES,
  HOME_SECTION_KEYS,
  type HomeFeaturedMode,
  type HomeSectionKey,
} from '../schemas/home-page.schema';

function trimmedString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function nullableObjectId(value: unknown): string | null | undefined {
  if (value === null || value === '') {
    return null;
  }

  return typeof value === 'string' ? value : undefined;
}

function objectIdArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => (typeof item === 'string' ? item.trim() : item));
}

export class HomeCtaDto {
  @ApiPropertyOptional({ maxLength: 80 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  href?: string;
}

export class HomeHeroDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ maxLength: 120 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  eyebrow?: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => nullableObjectId(value))
  @IsOptional()
  @IsMongoId()
  backgroundMediaId?: string | null;

  @ApiPropertyOptional({ type: HomeCtaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeCtaDto)
  primaryCta?: HomeCtaDto;

  @ApiPropertyOptional({ type: HomeCtaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeCtaDto)
  secondaryCta?: HomeCtaDto;
}

export class HomeAboutPreviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ maxLength: 160 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  heading?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => nullableObjectId(value))
  @IsOptional()
  @IsMongoId()
  mediaId?: string | null;

  @ApiPropertyOptional({ maxLength: 80 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  buttonLabel?: string;
}

export class HomeFeaturedPackagesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ maxLength: 160 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  heading?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: HOME_FEATURED_MODES })
  @IsOptional()
  @IsEnum(HOME_FEATURED_MODES)
  mode?: HomeFeaturedMode;

  @ApiPropertyOptional({ type: [String], maxItems: 12 })
  @Transform(({ value }) => objectIdArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ArrayUnique()
  @IsMongoId({ each: true })
  packageIds?: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number;
}

export class HomeFeaturedAlbumsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ maxLength: 160 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  heading?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: HOME_FEATURED_MODES })
  @IsOptional()
  @IsEnum(HOME_FEATURED_MODES)
  mode?: HomeFeaturedMode;

  @ApiPropertyOptional({ type: [String], maxItems: 12 })
  @Transform(({ value }) => objectIdArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ArrayUnique()
  @IsMongoId({ each: true })
  albumIds?: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number;
}

export class HomeUspItemDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class HomeUspDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ maxLength: 160 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  heading?: string;

  @ApiPropertyOptional({ type: [HomeUspItemDto], maxItems: 8 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => HomeUspItemDto)
  items?: HomeUspItemDto[];
}

export class HomeTestimonialDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  customerName?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  content?: string;
}

export class HomeTestimonialsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ maxLength: 160 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  heading?: string;

  @ApiPropertyOptional({ type: [HomeTestimonialDto], maxItems: 12 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => HomeTestimonialDto)
  items?: HomeTestimonialDto[];
}

export class HomeLatestPostsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ maxLength: 160 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  heading?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number;
}

export class HomeLocationsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ maxLength: 160 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  heading?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number;
}

export class HomeBookingCtaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ maxLength: 160 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  heading?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  buttonLabel?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => nullableObjectId(value))
  @IsOptional()
  @IsMongoId()
  backgroundMediaId?: string | null;
}

export class HomeSeoDto {
  @ApiPropertyOptional({ maxLength: 70 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(70)
  title?: string;

  @ApiPropertyOptional({ maxLength: 180 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  description?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => nullableObjectId(value))
  @IsOptional()
  @IsMongoId()
  ogImageMediaId?: string | null;
}

export class UpdateHomeDto {
  @ApiPropertyOptional({ type: HomeHeroDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeHeroDto)
  hero?: HomeHeroDto;

  @ApiPropertyOptional({ type: HomeAboutPreviewDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeAboutPreviewDto)
  aboutPreview?: HomeAboutPreviewDto;

  @ApiPropertyOptional({ type: HomeFeaturedPackagesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeFeaturedPackagesDto)
  featuredPackages?: HomeFeaturedPackagesDto;

  @ApiPropertyOptional({ type: HomeFeaturedAlbumsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeFeaturedAlbumsDto)
  featuredAlbums?: HomeFeaturedAlbumsDto;

  @ApiPropertyOptional({ type: HomeUspDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeUspDto)
  usp?: HomeUspDto;

  @ApiPropertyOptional({ type: HomeTestimonialsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeTestimonialsDto)
  testimonials?: HomeTestimonialsDto;

  @ApiPropertyOptional({ type: HomeLatestPostsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeLatestPostsDto)
  latestPosts?: HomeLatestPostsDto;

  @ApiPropertyOptional({ type: HomeLocationsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeLocationsDto)
  locations?: HomeLocationsDto;

  @ApiPropertyOptional({ type: HomeBookingCtaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeBookingCtaDto)
  bookingCta?: HomeBookingCtaDto;

  @ApiPropertyOptional({ enum: HOME_SECTION_KEYS, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(HOME_SECTION_KEYS.length)
  @ArrayUnique()
  @IsEnum(HOME_SECTION_KEYS, { each: true })
  sectionOrder?: HomeSectionKey[];

  @ApiPropertyOptional({ type: HomeSeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeSeoDto)
  seo?: HomeSeoDto;
}

