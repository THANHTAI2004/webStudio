import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMediaDto {
  @ApiPropertyOptional({
    maxLength: 300,
    example: 'Ảnh cưới tại Đà Lạt',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  alt?: string;
}
