import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { createSlug } from '../../../common/utils/slug';

export class CreateAlbumCategoryDto {
  @ApiProperty({
    example: 'Wedding',
    maxLength: 120,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    example: 'wedding',
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() ? createSlug(value) : undefined,
  )
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    default: '',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
