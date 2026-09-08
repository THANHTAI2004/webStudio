import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  THEME_BODY_FONTS,
  THEME_BUTTON_STYLES,
  THEME_HEADING_FONTS,
  type ThemeBodyFont,
  type ThemeButtonStyle,
  type ThemeHeadingFont,
} from '../schemas/theme.schema';

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export class ThemeColorsDto {
  @ApiPropertyOptional({ example: '#0F766E' })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  primary?: string;

  @ApiPropertyOptional({ example: '#111827' })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  secondary?: string;

  @ApiPropertyOptional({ example: '#FAFAF9' })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  background?: string;

  @ApiPropertyOptional({ example: '#FFFFFF' })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  surface?: string;

  @ApiPropertyOptional({ example: '#18181B' })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  text?: string;

  @ApiPropertyOptional({ example: '#52525B' })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  mutedText?: string;

  @ApiPropertyOptional({ example: '#E4E4E7' })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  border?: string;

  @ApiPropertyOptional({ example: '#C9A96E' })
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN)
  accent?: string;
}

export class ThemeButtonsDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(40)
  radius?: number;

  @ApiPropertyOptional({ enum: THEME_BUTTON_STYLES })
  @IsOptional()
  @IsEnum(THEME_BUTTON_STYLES)
  style?: ThemeButtonStyle;
}

export class ThemeCardsDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(40)
  radius?: number;
}

export class ThemeLayoutDto {
  @ApiPropertyOptional({ minimum: 960, maximum: 1600 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(960)
  @Max(1600)
  maxWidth?: number;
}

export class ThemeTypographyDto {
  @ApiPropertyOptional({ enum: THEME_HEADING_FONTS })
  @IsOptional()
  @IsEnum(THEME_HEADING_FONTS)
  headingFont?: ThemeHeadingFont;

  @ApiPropertyOptional({ enum: THEME_BODY_FONTS })
  @IsOptional()
  @IsEnum(THEME_BODY_FONTS)
  bodyFont?: ThemeBodyFont;
}

export class UpdateThemeDto {
  @ApiPropertyOptional({ type: ThemeColorsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeColorsDto)
  colors?: ThemeColorsDto;

  @ApiPropertyOptional({ type: ThemeButtonsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeButtonsDto)
  buttons?: ThemeButtonsDto;

  @ApiPropertyOptional({ type: ThemeCardsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeCardsDto)
  cards?: ThemeCardsDto;

  @ApiPropertyOptional({ type: ThemeLayoutDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeLayoutDto)
  layout?: ThemeLayoutDto;

  @ApiPropertyOptional({ type: ThemeTypographyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeTypographyDto)
  typography?: ThemeTypographyDto;
}

