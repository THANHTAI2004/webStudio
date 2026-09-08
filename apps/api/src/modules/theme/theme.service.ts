import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateThemeDto } from './dto/update-theme.dto';
import {
  Theme,
  ThemeBodyFont,
  ThemeButtonStyle,
  ThemeColors,
  ThemeDocument,
  ThemeHeadingFont,
} from './schemas/theme.schema';

const DEFAULT_KEY = 'default';

export interface ThemeResponse {
  key?: 'default';
  colors: ThemeColors;
  buttons: {
    radius: number;
    style: ThemeButtonStyle;
  };
  cards: {
    radius: number;
  };
  layout: {
    maxWidth: number;
  };
  typography: {
    headingFont: ThemeHeadingFont;
    bodyFont: ThemeBodyFont;
  };
  createdAt?: string | null;
  updatedAt?: string | null;
}

@Injectable()
export class ThemeService {
  constructor(
    @InjectModel(Theme.name)
    private readonly themeModel: Model<Theme>,
  ) {}

  async getPublicTheme(): Promise<ThemeResponse> {
    const theme = await this.themeModel.findOne({ key: DEFAULT_KEY }).exec();

    return this.toThemeResponse(theme);
  }

  async getAdminTheme(): Promise<ThemeResponse> {
    const theme = await this.themeModel.findOne({ key: DEFAULT_KEY }).exec();

    return {
      ...this.toThemeResponse(theme),
      key: 'default',
    };
  }

  async updateTheme(dto: UpdateThemeDto): Promise<ThemeResponse> {
    const current = this.toThemeResponse(
      await this.themeModel.findOne({ key: DEFAULT_KEY }).exec(),
    );
    const next = {
      key: 'default' as const,
      colors: {
        ...current.colors,
        ...dto.colors,
      },
      buttons: {
        ...current.buttons,
        ...dto.buttons,
      },
      cards: {
        ...current.cards,
        ...dto.cards,
      },
      layout: {
        ...current.layout,
        ...dto.layout,
      },
      typography: {
        ...current.typography,
        ...dto.typography,
      },
    };
    const saved = await this.themeModel
      .findOneAndUpdate(
        { key: DEFAULT_KEY },
        { $set: next },
        {
          returnDocument: 'after',
          setDefaultsOnInsert: true,
          upsert: true,
        },
      )
      .exec();

    return {
      ...this.toThemeResponse(saved),
      key: 'default',
    };
  }

  private toThemeResponse(theme: ThemeDocument | null): ThemeResponse {
    if (!theme) {
      return createDefaultThemeResponse();
    }

    return {
      colors: {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        background: theme.colors.background,
        surface: theme.colors.surface,
        text: theme.colors.text,
        mutedText: theme.colors.mutedText,
        border: theme.colors.border,
        accent: theme.colors.accent,
      },
      buttons: {
        radius: theme.buttons.radius,
        style: theme.buttons.style,
      },
      cards: {
        radius: theme.cards.radius,
      },
      layout: {
        maxWidth: theme.layout.maxWidth,
      },
      typography: {
        headingFont: theme.typography.headingFont,
        bodyFont: theme.typography.bodyFont,
      },
      createdAt: theme.createdAt.toISOString(),
      updatedAt: theme.updatedAt.toISOString(),
    };
  }
}

function createDefaultThemeResponse(): ThemeResponse {
  return {
    colors: {
      primary: '#0F766E',
      secondary: '#111827',
      background: '#FAFAF9',
      surface: '#FFFFFF',
      text: '#18181B',
      mutedText: '#52525B',
      border: '#E4E4E7',
      accent: '#C9A96E',
    },
    buttons: {
      radius: 6,
      style: 'solid',
    },
    cards: {
      radius: 8,
    },
    layout: {
      maxWidth: 1152,
    },
    typography: {
      headingFont: 'sans',
      bodyFont: 'sans',
    },
    createdAt: null,
    updatedAt: null,
  };
}
