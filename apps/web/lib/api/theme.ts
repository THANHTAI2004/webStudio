import { getApiBaseUrl } from "./client";

export type ThemeButtonStyle = "solid" | "outline";
export type ThemeHeadingFont = "serif" | "sans" | "elegant";
export type ThemeBodyFont = "sans" | "serif";

export interface PublicTheme {
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
}

interface ThemeResponse {
  success: true;
  data: PublicTheme;
}

interface CmsRequestOptions {
  cache?: RequestCache;
  revalidate?: number;
}

export const fallbackTheme: PublicTheme = {
  colors: {
    primary: "#0F766E",
    secondary: "#111827",
    background: "#FAFAF9",
    surface: "#FFFFFF",
    text: "#18181B",
    mutedText: "#52525B",
    border: "#E4E4E7",
    accent: "#C9A96E",
  },
  buttons: {
    radius: 6,
    style: "solid",
  },
  cards: {
    radius: 8,
  },
  layout: {
    maxWidth: 1152,
  },
  typography: {
    headingFont: "sans",
    bodyFont: "sans",
  },
};

export async function getPublicTheme(
  options: CmsRequestOptions = {},
): Promise<PublicTheme> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/theme`, {
      ...getFetchCacheOptions(options),
    });
  } catch {
    return fallbackTheme;
  }

  if (!response.ok) {
    return fallbackTheme;
  }

  const payload = (await response
    .json()
    .catch(() => null)) as ThemeResponse | null;

  return payload?.success ? payload.data : fallbackTheme;
}

function getFetchCacheOptions(options: CmsRequestOptions):
  | { cache: RequestCache }
  | { next: { revalidate: number } } {
  if (options.cache) {
    return { cache: options.cache };
  }

  return {
    next: {
      revalidate: options.revalidate ?? 60,
    },
  };
}
