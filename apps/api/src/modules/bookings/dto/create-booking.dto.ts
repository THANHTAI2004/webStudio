import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function optionalEmail(value: unknown): string | null | undefined {
  if (value === null || value === '') {
    return null;
  }

  return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
}

export class CreateBookingDto {
  @ApiProperty({
    example: 'Nguyen Van A',
    minLength: 2,
    maxLength: 120,
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customerName: string;

  @ApiProperty({
    example: '090 123 4567',
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  phone: string;

  @ApiPropertyOptional({
    example: 'test@example.com',
    nullable: true,
  })
  @Transform(({ value }) => optionalEmail(value))
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({
    description: 'Published package ObjectId.',
  })
  @IsOptional()
  @IsMongoId()
  packageId?: string;

  @ApiPropertyOptional({
    description: 'Published package slug. packageId is preferred.',
  })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(200)
  packageSlug?: string;

  @ApiProperty({
    example: '2026-12-25',
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @Matches(LOCAL_DATE_PATTERN)
  shootDate: string;

  @ApiProperty({
    example: '14:30',
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @Matches(LOCAL_TIME_PATTERN)
  shootTime: string;

  @ApiProperty({
    example: 2,
    minimum: 1,
    maximum: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  peopleCount: number;

  @ApiProperty({
    example: 'Studio Quan 1',
    maxLength: 300,
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  location: string;

  @ApiPropertyOptional({
    example: 'Muon phong cach nhe nhang',
    maxLength: 2000,
  })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customerNote?: string;
}
