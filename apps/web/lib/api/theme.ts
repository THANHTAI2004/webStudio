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
    primary: "#25231F",
    secondary: "#EDE8E2",
    background: "#F7F5F2",
    surface: "#FFFFFF",
    text: "#1D1D1B",
    mutedText: "#77736D",
    border: "#DDD8D1",
    accent: "#B39568",
  },
  buttons: {
    radius: 6,
    style: "solid",
  },
  cards: {
    radius: 8,
  },
  layout: {
    maxWidth: 1240,
  },
  typography: {
    headingFont: "serif",
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
