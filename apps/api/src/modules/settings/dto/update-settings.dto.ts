import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

function trimmedString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function lowerTrimmedString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
}

function nullableObjectId(value: unknown): string | null | undefined {
  if (value === null || value === '') {
    return null;
  }

  return typeof value === 'string' ? value : undefined;
}

export class SettingsContactDto {
  @ApiPropertyOptional({ maxLength: 50 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => lowerTrimmedString(value))
  @IsOptional()
  @IsString()
  @ValidateIf((_object, value) => value !== '')
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}

export class SettingsSocialsDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  facebook?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instagram?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  tiktok?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  youtube?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  zalo?: string;
}

export class SettingsNavigationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showHome?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showAbout?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showPackages?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showAlbums?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showNews?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showLocations?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showContact?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showBooking?: boolean;
}

export class SettingsDefaultSeoDto {
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

export class SettingsFooterDto {
  @ApiPropertyOptional({ maxLength: 1000 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ maxLength: 250 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(250)
  copyrightText?: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  studioName?: string;

  @ApiPropertyOptional({ maxLength: 250 })
  @Transform(({ value }) => trimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(250)
  tagline?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => nullableObjectId(value))
  @IsOptional()
  @IsMongoId()
  logoMediaId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => nullableObjectId(value))
  @IsOptional()
  @IsMongoId()
  faviconMediaId?: string | null;

  @ApiPropertyOptional({ type: SettingsContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SettingsContactDto)
  contact?: SettingsContactDto;

  @ApiPropertyOptional({ type: SettingsSocialsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SettingsSocialsDto)
  socials?: SettingsSocialsDto;

  @ApiPropertyOptional({ type: SettingsNavigationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SettingsNavigationDto)
  navigation?: SettingsNavigationDto;

  @ApiPropertyOptional({ type: SettingsDefaultSeoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SettingsDefaultSeoDto)
  defaultSeo?: SettingsDefaultSeoDto;

  @ApiPropertyOptional({ type: SettingsFooterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SettingsFooterDto)
  footer?: SettingsFooterDto;
}
