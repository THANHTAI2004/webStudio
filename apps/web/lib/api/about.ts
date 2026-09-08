import { getApiBaseUrl } from "./client";
import type { PublicMediaPreview } from "./settings";

export interface PublicGalleryVariant {
  url: string;
  width: number;
  height: number;
}

export interface PublicGalleryImage {
  id: string;
  alt: string;
  thumb: PublicGalleryVariant;
  medium: PublicGalleryVariant;
  large: PublicGalleryVariant;
}

export interface PublicAbout {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    media: PublicMediaPreview | null;
  };
  story: {
    heading: string;
    contentHtml: string;
    media: PublicMediaPreview | null;
    plainText: string;
  };
  philosophy: {
    heading: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  team: {
    enabled: boolean;
    heading: string;
    members: Array<{
      name: string;
      role: string;
      bio: string;
      media: PublicMediaPreview | null;
    }>;
  };
  metrics: Array<{
    value: string;
    label: string;
  }>;
  gallery: PublicGalleryImage[];
  bookingCta: {
    heading: string;
    description: string;
    buttonLabel: string;
  };
  seo: {
    title: string;
    description: string;
    ogImage: PublicMediaPreview | null;
  };
}

interface AboutResponse {
  success: true;
  data: PublicAbout;
}

interface CmsRequestOptions {
  cache?: RequestCache;
  revalidate?: number;
}

export const fallbackAbout: PublicAbout = {
  hero: {
    eyebrow: "",
    title: "Giới thiệu",
    subtitle: "",
    media: null,
  },
  story: {
    heading: "",
    contentHtml: "",
    media: null,
    plainText: "",
  },
  philosophy: {
    heading: "",
    items: [],
  },
  team: {
    enabled: false,
    heading: "",
    members: [],
  },
  metrics: [],
  gallery: [],
  bookingCta: {
    heading: "",
    description: "",
    buttonLabel: "Đặt lịch",
  },
  seo: {
    title: "",
    description: "",
    ogImage: null,
  },
};

export async function getPublicAbout(
  options: CmsRequestOptions = {},
): Promise<PublicAbout> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/about`, {
      ...getFetchCacheOptions(options),
    });
  } catch {
    return fallbackAbout;
  }

  if (!response.ok) {
    return fallbackAbout;
  }

  const payload = (await response
    .json()
    .catch(() => null)) as AboutResponse | null;

  return payload?.success ? payload.data : fallbackAbout;
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
