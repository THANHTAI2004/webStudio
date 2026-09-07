import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { createSlug } from '../../../common/utils/slug';
import { ALBUM_STATUSES, type AlbumStatus } from '../schemas/album.schema';
import { AlbumSeoDto } from './album-seo.dto';

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

function nullableDate(value: unknown): Date | null | undefined {
  if (value === null || value === '') {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  return new Date(String(value));
}

function stringArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => (typeof item === 'string' ? item.trim() : item));
}

export class CreateAlbumDto {
  @ApiProperty({
    example: 'Anh Cuoi Da Lat',
    maxLength: 200,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'anh-cuoi-da-lat',
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
  coverMediaId?: string | null;

  @ApiPropertyOptional({
    type: [String],
    maxItems: 200,
  })
  @Transform(({ value }) => stringArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsMongoId({ each: true })
  galleryMediaIds?: string[];

  @ApiPropertyOptional({
    default: '',
    maxLength: 1000,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    default: '',
    maxLength: 20000,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  content?: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @Transform(({ value }) => nullableDate(value))
  @IsOptional()
  @IsDate()
  shootingDate?: Date | null;

  @ApiPropertyOptional({
    default: '',
    maxLength: 250,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(250)
  location?: string;

  @ApiPropertyOptional({
    enum: ALBUM_STATUSES,
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(ALBUM_STATUSES)
  status?: AlbumStatus;

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
    type: AlbumSeoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AlbumSeoDto)
  seo?: AlbumSeoDto;
}
