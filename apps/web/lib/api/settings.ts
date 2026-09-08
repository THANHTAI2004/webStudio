import { getApiBaseUrl } from "./client";

export interface PublicMediaPreview {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface PublicSettings {
  studioName: string;
  tagline: string;
  logo: PublicMediaPreview | null;
  favicon: PublicMediaPreview | null;
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  socials: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
    zalo: string;
  };
  navigation: {
    showHome: boolean;
    showAbout: boolean;
    showPackages: boolean;
    showAlbums: boolean;
    showNews: boolean;
    showLocations: boolean;
    showContact: boolean;
    showBooking: boolean;
  };
  defaultSeo: {
    title: string;
    description: string;
    ogImage: PublicMediaPreview | null;
  };
  footer: {
    description: string;
    copyrightText: string;
  };
}

interface SettingsResponse {
  success: true;
  data: PublicSettings;
}

interface CmsRequestOptions {
  cache?: RequestCache;
  revalidate?: number;
}

export const fallbackSettings: PublicSettings = {
  studioName: "Studio",
  tagline: "",
  logo: null,
  favicon: null,
  contact: {
    phone: "",
    email: "",
    address: "",
  },
  socials: {
    facebook: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    zalo: "",
  },
  navigation: {
    showHome: true,
    showAbout: true,
    showPackages: true,
    showAlbums: true,
    showNews: true,
    showLocations: true,
    showContact: true,
    showBooking: true,
  },
  defaultSeo: {
    title: "Studio",
    description: "Dịch vụ chụp ảnh chuyên nghiệp cho những khoảnh khắc đáng nhớ.",
    ogImage: null,
  },
  footer: {
    description: "",
    copyrightText: "",
  },
};

export async function getPublicSettings(
  options: CmsRequestOptions = {},
): Promise<PublicSettings> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/settings/public`, {
      ...getFetchCacheOptions(options),
    });
  } catch {
    return fallbackSettings;
  }

  if (!response.ok) {
    return fallbackSettings;
  }

  const payload = (await response
    .json()
    .catch(() => null)) as SettingsResponse | null;

  return payload?.success ? payload.data : fallbackSettings;
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
