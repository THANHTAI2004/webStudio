import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const THEME_BUTTON_STYLES = ['solid', 'outline'] as const;
export const THEME_HEADING_FONTS = ['serif', 'sans', 'elegant'] as const;
export const THEME_BODY_FONTS = ['sans', 'serif'] as const;

export type ThemeButtonStyle = (typeof THEME_BUTTON_STYLES)[number];
export type ThemeHeadingFont = (typeof THEME_HEADING_FONTS)[number];
export type ThemeBodyFont = (typeof THEME_BODY_FONTS)[number];
export type ThemeDocument = HydratedDocument<Theme>;

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
}

export interface ThemeButtons {
  radius: number;
  style: ThemeButtonStyle;
}

export interface ThemeCards {
  radius: number;
}

export interface ThemeLayout {
  maxWidth: number;
}

export interface ThemeTypography {
  headingFont: ThemeHeadingFont;
  bodyFont: ThemeBodyFont;
}

const colorsSchema = {
  _id: false,
  primary: { type: String, default: '#0F766E' },
  secondary: { type: String, default: '#111827' },
  background: { type: String, default: '#FAFAF9' },
  surface: { type: String, default: '#FFFFFF' },
  text: { type: String, default: '#18181B' },
  mutedText: { type: String, default: '#52525B' },
  border: { type: String, default: '#E4E4E7' },
  accent: { type: String, default: '#C9A96E' },
};

const buttonsSchema = {
  _id: false,
  radius: { type: Number, default: 6, min: 0, max: 40 },
  style: {
    type: String,
    enum: THEME_BUTTON_STYLES,
    default: 'solid',
  },
};

const cardsSchema = {
  _id: false,
  radius: { type: Number, default: 8, min: 0, max: 40 },
};

const layoutSchema = {
  _id: false,
  maxWidth: { type: Number, default: 1152, min: 960, max: 1600 },
};

const typographySchema = {
  _id: false,
  headingFont: {
    type: String,
    enum: THEME_HEADING_FONTS,
    default: 'sans',
  },
  bodyFont: {
    type: String,
    enum: THEME_BODY_FONTS,
    default: 'sans',
  },
};

@Schema({
  collection: 'themes',
  timestamps: true,
  versionKey: false,
})
export class Theme {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    default: 'default',
    unique: true,
    index: true,
  })
  key: 'default';

  @Prop({ type: colorsSchema, default: () => createDefaultColors() })
  colors: ThemeColors;

  @Prop({
    type: buttonsSchema,
    default: () => ({
      radius: 6,
      style: 'solid',
    }),
  })
  buttons: ThemeButtons;

  @Prop({
    type: cardsSchema,
    default: () => ({
      radius: 8,
    }),
  })
  cards: ThemeCards;

  @Prop({
    type: layoutSchema,
    default: () => ({
      maxWidth: 1152,
    }),
  })
  layout: ThemeLayout;

  @Prop({
    type: typographySchema,
    default: () => ({
      headingFont: 'sans',
      bodyFont: 'sans',
    }),
  })
  typography: ThemeTypography;

  createdAt: Date;

  updatedAt: Date;
}

export const ThemeSchema = SchemaFactory.createForClass(Theme);

function createDefaultColors(): ThemeColors {
  return {
    primary: '#0F766E',
    secondary: '#111827',
    background: '#FAFAF9',
    surface: '#FFFFFF',
    text: '#18181B',
    mutedText: '#52525B',
    border: '#E4E4E7',
    accent: '#C9A96E',
  };
}

