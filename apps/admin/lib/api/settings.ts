import { apiRequest } from "./client";
import type { CmsMediaPreview } from "./cms-media";

export interface AdminSettings {
  key: "default";
  studioName: string;
  tagline: string;
  logoMediaId: string | null;
  logo: CmsMediaPreview | null;
  faviconMediaId: string | null;
  favicon: CmsMediaPreview | null;
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
    ogImageMediaId: string | null;
    ogImage: CmsMediaPreview | null;
  };
  footer: {
    description: string;
    copyrightText: string;
  };
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SettingsInput {
  studioName?: string;
  tagline?: string;
  logoMediaId?: string | null;
  faviconMediaId?: string | null;
  contact?: Partial<AdminSettings["contact"]>;
  socials?: Partial<AdminSettings["socials"]>;
  navigation?: Partial<AdminSettings["navigation"]>;
  defaultSeo?: {
    title?: string;
    description?: string;
    ogImageMediaId?: string | null;
  };
  footer?: Partial<AdminSettings["footer"]>;
}

interface SettingsResponse {
  success: true;
  data: AdminSettings;
}

export function getSettings(): Promise<SettingsResponse> {
  return apiRequest<SettingsResponse>("/admin/settings");
}

export function updateSettings(input: SettingsInput): Promise<SettingsResponse> {
  return apiRequest<SettingsResponse>("/admin/settings", {
    method: "PATCH",
    body: input,
  });
}

