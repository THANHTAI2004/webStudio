import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

function nullableObjectId(value: unknown): string | null | undefined {
  if (value === null || value === '') {
    return null;
  }

  return typeof value === 'string' ? value : undefined;
}

export class PostSeoDto {
  @ApiPropertyOptional({
    default: '',
    maxLength: 70,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(70)
  title?: string;

  @ApiPropertyOptional({
    default: '',
    maxLength: 180,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  description?: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @Transform(({ value }) => nullableObjectId(value))
  @IsOptional()
  @IsMongoId()
  ogImageMediaId?: string | null;
}
