import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.trim();
}

function nullableObjectId(value: unknown): string | null | undefined {
  if (value === null || value === '') {
    return null;
  }

  return typeof value === 'string' ? value : undefined;
}

export class AlbumSeoDto {
  @ApiPropertyOptional({
    maxLength: 70,
  })
  @Transform(({ value }) => optionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(70)
  title?: string;

  @ApiPropertyOptional({
    maxLength: 180,
  })
  @Transform(({ value }) => optionalString(value))
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
