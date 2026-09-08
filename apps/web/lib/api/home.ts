import { getApiBaseUrl } from "./client";
import type { PublicMediaPreview } from "./settings";

export type HomeSectionKey =
  | "hero"
  | "aboutPreview"
  | "featuredPackages"
  | "featuredAlbums"
  | "usp"
  | "testimonials"
  | "latestPosts"
  | "locations"
  | "bookingCta";

export type HomeFeaturedMode = "automatic" | "manual";

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface HomePackageCard {
  id: string;
  name: string;
  slug: string;
  category: CategorySummary | null;
  thumbnail: PublicMediaPreview | null;
  price: number;
  salePrice: number | null;
  description: string;
}

export interface HomeAlbumCard {
  id: string;
  title: string;
  slug: string;
  category: CategorySummary | null;
  cover: PublicMediaPreview | null;
  description: string;
  location: string;
  shootingDate: string | null;
}

export interface HomePostCard {
  id: string;
  title: string;
  slug: string;
  category: CategorySummary | null;
  cover: PublicMediaPreview | null;
  excerpt: string;
  publishedAt: string | null;
}

export interface HomeLocationCard {
  id: string;
  name: string;
  slug: string;
  cover: PublicMediaPreview | null;
  address: string;
  phone: string;
}

export interface PublicHome {
  hero: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    background: PublicMediaPreview | null;
    primaryCta: {
      label: string;
      href: string;
    };
    secondaryCta: {
      label: string;
      href: string;
    };
  };
  aboutPreview: {
    enabled: boolean;
    heading: string;
    description: string;
    media: PublicMediaPreview | null;
    buttonLabel: string;
  };
  featuredPackages: {
    enabled: boolean;
    heading: string;
    description: string;
    mode: HomeFeaturedMode;
    limit: number;
    packages: HomePackageCard[];
  };
  featuredAlbums: {
    enabled: boolean;
    heading: string;
    description: string;
    mode: HomeFeaturedMode;
    limit: number;
    albums: HomeAlbumCard[];
  };
  usp: {
    enabled: boolean;
    heading: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  testimonials: {
    enabled: boolean;
    heading: string;
    items: Array<{
      customerName: string;
      content: string;
    }>;
  };
  latestPosts: {
    enabled: boolean;
    heading: string;
    description: string;
    limit: number;
    posts: HomePostCard[];
  };
  locations: {
    enabled: boolean;
    heading: string;
    description: string;
    limit: number;
    locations: HomeLocationCard[];
  };
  bookingCta: {
    enabled: boolean;
    heading: string;
    description: string;
    buttonLabel: string;
    background: PublicMediaPreview | null;
  };
  sectionOrder: HomeSectionKey[];
  seo: {
    title: string;
    description: string;
    ogImage: PublicMediaPreview | null;
  };
}

interface HomeResponse {
  success: true;
  data: PublicHome;
}

interface CmsRequestOptions {
  cache?: RequestCache;
  revalidate?: number;
}

export const homeSectionKeys: HomeSectionKey[] = [
  "hero",
  "aboutPreview",
  "featuredPackages",
  "featuredAlbums",
  "usp",
  "testimonials",
  "latestPosts",
  "locations",
  "bookingCta",
];

export const fallbackHome: PublicHome = {
  hero: {
    enabled: true,
    eyebrow: "",
    title: "Studio",
    subtitle: "",
    background: null,
    primaryCta: {
      label: "Đặt lịch ngay",
      href: "/dat-lich",
    },
    secondaryCta: {
      label: "Xem gói chụp",
      href: "/goi-chup",
    },
  },
  aboutPreview: {
    enabled: false,
    heading: "",
    description: "",
    media: null,
    buttonLabel: "Tìm hiểu Studio",
  },
  featuredPackages: {
    enabled: false,
    heading: "",
    description: "",
    mode: "automatic",
    limit: 3,
    packages: [],
  },
  featuredAlbums: {
    enabled: false,
    heading: "",
    description: "",
    mode: "automatic",
    limit: 3,
    albums: [],
  },
  usp: {
    enabled: false,
    heading: "",
    items: [],
  },
  testimonials: {
    enabled: false,
    heading: "",
    items: [],
  },
  latestPosts: {
    enabled: false,
    heading: "",
    description: "",
    limit: 3,
    posts: [],
  },
  locations: {
    enabled: false,
    heading: "",
    description: "",
    limit: 3,
    locations: [],
  },
  bookingCta: {
    enabled: false,
    heading: "",
    description: "",
    buttonLabel: "Đặt lịch chụp",
    background: null,
  },
  sectionOrder: homeSectionKeys,
  seo: {
    title: "",
    description: "",
    ogImage: null,
  },
};

export async function getPublicHome(
  options: CmsRequestOptions = {},
): Promise<PublicHome> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/home`, {
      ...getFetchCacheOptions(options),
    });
  } catch {
    return fallbackHome;
  }

  if (!response.ok) {
    return fallbackHome;
  }

  const payload = (await response
    .json()
    .catch(() => null)) as HomeResponse | null;

  return payload?.success ? payload.data : fallbackHome;
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
