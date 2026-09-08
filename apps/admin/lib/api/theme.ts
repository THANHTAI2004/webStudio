import { apiRequest } from "./client";

export type ThemeButtonStyle = "solid" | "outline";
export type ThemeHeadingFont = "serif" | "sans" | "elegant";
export type ThemeBodyFont = "sans" | "serif";

export interface AdminTheme {
  key?: "default";
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    border: string;
    accent: string;
  };
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

export interface ThemeInput {
  colors?: Partial<AdminTheme["colors"]>;
  buttons?: Partial<AdminTheme["buttons"]>;
  cards?: Partial<AdminTheme["cards"]>;
  layout?: Partial<AdminTheme["layout"]>;
  typography?: Partial<AdminTheme["typography"]>;
}

interface ThemeResponse {
  success: true;
  data: AdminTheme;
}

export function getTheme(): Promise<ThemeResponse> {
  return apiRequest<ThemeResponse>("/admin/theme");
}

export function updateTheme(input: ThemeInput): Promise<ThemeResponse> {
  return apiRequest<ThemeResponse>("/admin/theme", {
    method: "PATCH",
    body: input,
  });
}

