import { apiRequest } from "./client";
import type { CmsMediaPreview } from "./cms-media";

export interface AdminAbout {
  key: "default";
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    mediaId: string | null;
    media: CmsMediaPreview | null;
  };
  story: {
    heading: string;
    contentHtml: string;
    mediaId: string | null;
    media: CmsMediaPreview | null;
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
      mediaId: string | null;
      media: CmsMediaPreview | null;
    }>;
  };
  metrics: Array<{
    value: string;
    label: string;
  }>;
  galleryMediaIds: string[];
  gallery: CmsMediaPreview[];
  bookingCta: {
    heading: string;
    description: string;
    buttonLabel: string;
  };
  seo: {
    title: string;
    description: string;
    ogImageMediaId: string | null;
    ogImage: CmsMediaPreview | null;
  };
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AboutInput {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    mediaId: string | null;
  };
  story: {
    heading: string;
    contentHtml: string;
    mediaId: string | null;
  };
  philosophy: AdminAbout["philosophy"];
  team: {
    enabled: boolean;
    heading: string;
    members: Array<{
      name: string;
      role: string;
      bio: string;
      mediaId: string | null;
    }>;
  };
  metrics: AdminAbout["metrics"];
  galleryMediaIds: string[];
  bookingCta: AdminAbout["bookingCta"];
  seo: {
    title: string;
    description: string;
    ogImageMediaId: string | null;
  };
}

interface AboutResponse {
  success: true;
  data: AdminAbout;
}

export function getAbout(): Promise<AboutResponse> {
  return apiRequest<AboutResponse>("/admin/about");
}

export function updateAbout(input: AboutInput): Promise<AboutResponse> {
  return apiRequest<AboutResponse>("/admin/about", {
    method: "PATCH",
    body: input,
  });
}
