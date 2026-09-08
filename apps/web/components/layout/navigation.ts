import type { PublicSettings } from "@/lib/api/settings";

export interface SiteNavigationItem {
  href: string;
  label: string;
  settingKey: keyof PublicSettings["navigation"];
}

export const siteNavigation: SiteNavigationItem[] = [
  {
    href: "/",
    label: "Trang ch\u1ee7",
    settingKey: "showHome",
  },
  {
    href: "/gioi-thieu",
    label: "Gi\u1edbi thi\u1ec7u",
    settingKey: "showAbout",
  },
  {
    href: "/goi-chup",
    label: "G\u00f3i ch\u1ee5p",
    settingKey: "showPackages",
  },
  {
    href: "/album",
    label: "Album",
    settingKey: "showAlbums",
  },
  {
    href: "/tin-tuc",
    label: "Bài viết",
    settingKey: "showNews",
  },
  {
    href: "/dia-diem",
    label: "Cơ sở",
    settingKey: "showLocations",
  },
  {
    href: "/lien-he",
    label: "Li\u00ean h\u1ec7",
    settingKey: "showContact",
  },
  {
    href: "/dat-lich",
    label: "\u0110\u1eb7t l\u1ecbch",
    settingKey: "showBooking",
  },
];

export function getVisibleNavigation(settings: PublicSettings) {
  return siteNavigation.filter((item) => settings.navigation[item.settingKey]);
}
