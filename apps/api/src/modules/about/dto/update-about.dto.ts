import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

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

export class AboutHeroDto {
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
  mediaId?: string | null;
}

export class AboutStoryDto {
  @ApiPropertyOptional({ maxLength: 160 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  heading?: string;

  @ApiPropertyOptional({ maxLength: 100000 })
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  contentHtml?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => nullableObjectId(value))
  @IsOptional()
  @IsMongoId()
  mediaId?: string | null;
}

export class AboutPhilosophyItemDto {
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

export class AboutPhilosophyDto {
  @ApiPropertyOptional({ maxLength: 160 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  heading?: string;

  @ApiPropertyOptional({ type: [AboutPhilosophyItemDto], maxItems: 8 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => AboutPhilosophyItemDto)
  items?: AboutPhilosophyItemDto[];
}

export class AboutTeamMemberDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  role?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => nullableObjectId(value))
  @IsOptional()
  @IsMongoId()
  mediaId?: string | null;
}

export class AboutTeamDto {
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

  @ApiPropertyOptional({ type: [AboutTeamMemberDto], maxItems: 20 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AboutTeamMemberDto)
  members?: AboutTeamMemberDto[];
}

export class AboutMetricDto {
  @ApiPropertyOptional({ maxLength: 50 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  value?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;
}

export class AboutBookingCtaDto {
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
}

export class AboutSeoDto {
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

export class UpdateAboutDto {
  @ApiPropertyOptional({ type: AboutHeroDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AboutHeroDto)
  hero?: AboutHeroDto;

  @ApiPropertyOptional({ type: AboutStoryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AboutStoryDto)
  story?: AboutStoryDto;

  @ApiPropertyOptional({ type: AboutPhilosophyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AboutPhilosophyDto)
  philosophy?: AboutPhilosophyDto;

  @ApiPropertyOptional({ type: AboutTeamDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AboutTeamDto)
  team?: AboutTeamDto;

  @ApiPropertyOptional({ type: [AboutMetricDto], maxItems: 12 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => AboutMetricDto)
  metrics?: AboutMetricDto[];

  @ApiPropertyOptional({ type: [String], maxItems: 30 })
  @Transform(({ value }) => objectIdArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsMongoId({ each: true })
  galleryMediaIds?: string[];

  @ApiPropertyOptional({ type: AboutBookingCtaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AboutBookingCtaDto)
  bookingCta?: AboutBookingCtaDto;

  @ApiPropertyOptional({ type: AboutSeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AboutSeoDto)
  seo?: AboutSeoDto;
}

