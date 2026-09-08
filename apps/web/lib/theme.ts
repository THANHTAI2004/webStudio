import type { CSSProperties } from "react";
import { fallbackTheme, type PublicTheme } from "@/lib/api/theme";

export function getThemeCssVariables(theme: PublicTheme): CSSProperties {
  const colors = {
    ...fallbackTheme.colors,
    ...theme.colors,
  };
  const buttons = {
    ...fallbackTheme.buttons,
    ...theme.buttons,
  };
  const cards = {
    ...fallbackTheme.cards,
    ...theme.cards,
  };
  const layout = {
    ...fallbackTheme.layout,
    ...theme.layout,
  };
  const typography = {
    ...fallbackTheme.typography,
    ...theme.typography,
  };

  return {
    "--color-primary": colors.primary,
    "--color-secondary": colors.secondary,
    "--color-background": colors.background,
    "--color-surface": colors.surface,
    "--color-text": colors.text,
    "--color-muted": colors.mutedText,
    "--color-border": colors.border,
    "--color-accent": colors.accent,
    "--button-radius": `${buttons.radius}px`,
    "--card-radius": `${cards.radius}px`,
    "--site-max-width": `${layout.maxWidth}px`,
    "--font-heading": getHeadingFontStack(typography.headingFont),
    "--font-body": getBodyFontStack(typography.bodyFont),
  } as CSSProperties;
}

export function getHeadingFontStack(
  font: PublicTheme["typography"]["headingFont"],
): string {
  switch (font) {
    case "serif":
      return 'Georgia, "Times New Roman", serif';
    case "elegant":
      return "Georgia, serif";
    case "sans":
    default:
      return "Arial, Helvetica, sans-serif";
  }
}

export function getBodyFontStack(
  font: PublicTheme["typography"]["bodyFont"],
): string {
  switch (font) {
    case "serif":
      return 'Georgia, "Times New Roman", serif';
    case "sans":
    default:
      return "Arial, Helvetica, sans-serif";
  }
}
