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
import { POST_STATUSES, type PostStatus } from '../schemas/post.schema';
import { PostSeoDto } from './post-seo.dto';

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

export class CreatePostDto {
  @ApiProperty({
    example: '5 Kinh Nghiem Chup Anh Cuoi',
    maxLength: 220,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(220)
  title: string;

  @ApiPropertyOptional({
    example: '5-kinh-nghiem-chup-anh-cuoi',
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
    default: '',
    maxLength: 500,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional({
    default: '',
    maxLength: 100000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  contentHtml?: string;

  @ApiPropertyOptional({
    type: [String],
    maxItems: 20,
  })
  @Transform(({ value }) => stringArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    enum: POST_STATUSES,
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(POST_STATUSES)
  status?: PostStatus;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    nullable: true,
  })
  @Transform(({ value }) => nullableDate(value))
  @IsOptional()
  @IsDate()
  publishedAt?: Date | null;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    type: PostSeoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostSeoDto)
  seo?: PostSeoDto;
}
