import { apiRequest } from "./client";
import type { CmsMediaPreview } from "./cms-media";

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

export interface AdminHome {
  key: "default";
  hero: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    backgroundMediaId: string | null;
    background: CmsMediaPreview | null;
    primaryCta: CtaInput;
    secondaryCta: CtaInput;
  };
  aboutPreview: {
    enabled: boolean;
    heading: string;
    description: string;
    mediaId: string | null;
    media: CmsMediaPreview | null;
    buttonLabel: string;
  };
  featuredPackages: {
    enabled: boolean;
    heading: string;
    description: string;
    mode: HomeFeaturedMode;
    packageIds: string[];
    limit: number;
  };
  featuredAlbums: {
    enabled: boolean;
    heading: string;
    description: string;
    mode: HomeFeaturedMode;
    albumIds: string[];
    limit: number;
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
  };
  locations: {
    enabled: boolean;
    heading: string;
    description: string;
    limit: number;
  };
  bookingCta: {
    enabled: boolean;
    heading: string;
    description: string;
    buttonLabel: string;
    backgroundMediaId: string | null;
    background: CmsMediaPreview | null;
  };
  sectionOrder: HomeSectionKey[];
  seo: {
    title: string;
    description: string;
    ogImageMediaId: string | null;
    ogImage: CmsMediaPreview | null;
  };
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CtaInput {
  label: string;
  href: string;
}

export interface HomeInput {
  hero: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    backgroundMediaId: string | null;
    primaryCta: CtaInput;
    secondaryCta: CtaInput;
  };
  aboutPreview: {
    enabled: boolean;
    heading: string;
    description: string;
    mediaId: string | null;
    buttonLabel: string;
  };
  featuredPackages: AdminHome["featuredPackages"];
  featuredAlbums: AdminHome["featuredAlbums"];
  usp: AdminHome["usp"];
  testimonials: AdminHome["testimonials"];
  latestPosts: AdminHome["latestPosts"];
  locations: AdminHome["locations"];
  bookingCta: {
    enabled: boolean;
    heading: string;
    description: string;
    buttonLabel: string;
    backgroundMediaId: string | null;
  };
  sectionOrder: HomeSectionKey[];
  seo: {
    title: string;
    description: string;
    ogImageMediaId: string | null;
  };
}

interface HomeResponse {
  success: true;
  data: AdminHome;
}

export function getHome(): Promise<HomeResponse> {
  return apiRequest<HomeResponse>("/admin/home");
}

export function updateHome(input: HomeInput): Promise<HomeResponse> {
  return apiRequest<HomeResponse>("/admin/home", {
    method: "PATCH",
    body: input,
  });
}
