import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const NO_HTML_TAG_PATTERN = /^(?![\s\S]*<[^>\n]+>)[\s\S]*$/;

function trimmedString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
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

export class CreateContactDto {
  @ApiProperty({ example: 'Nguyen Van A', minLength: 2, maxLength: 120 })
  @Transform(({ value }) => trimmedString(value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customerName: string;

  @ApiProperty({ example: '0901234567', maxLength: 50 })
  @Transform(({ value }) => trimmedString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => nullableEmail(value))
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiProperty({ example: 'Tu van chup anh cuoi', maxLength: 200 })
  @Transform(({ value }) => trimmedString(value))
  @IsString()
  @IsNotEmpty()
  @Matches(NO_HTML_TAG_PATTERN)
  @MaxLength(200)
  subject: string;

  @ApiProperty({ minLength: 5, maxLength: 5000 })
  @Transform(({ value }) => trimmedString(value))
  @IsString()
  @MinLength(5)
  @Matches(NO_HTML_TAG_PATTERN)
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => nullableObjectId(value))
  @IsOptional()
  @IsMongoId()
  locationId?: string | null;
}
