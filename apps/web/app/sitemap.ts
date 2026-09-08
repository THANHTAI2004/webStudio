import type { MetadataRoute } from "next";
import { getAlbums, type PublicAlbumListItem } from "@/lib/api/albums";
import { getLocations, type PublicLocationListItem } from "@/lib/api/locations";
import { getPackages, type PublicPackageListItem } from "@/lib/api/packages";
import { getPosts, type PublicPostListItem } from "@/lib/api/posts";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

const STATIC_ROUTES = [
  "/",
  "/gioi-thieu",
  "/goi-chup",
  "/album",
  "/tin-tuc",
  "/dat-lich",
  "/dia-diem",
  "/lien-he",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (getSiteUrl() ?? new URL("http://localhost:3000")).toString();
  const now = new Date();
  const [packages, albums, posts, locations] = await Promise.all([
    getAllPackages(),
    getAllAlbums(),
    getAllPosts(),
    getAllLocations(),
  ]);

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: toAbsoluteUrl(baseUrl, route),
      lastModified: now,
      changeFrequency: route === "/" ? "daily" as const : "weekly" as const,
      priority: route === "/" ? 1 : 0.8,
    })),
    ...packages.map((item) => ({
      url: toAbsoluteUrl(baseUrl, `/goi-chup/${item.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...albums.map((item) => ({
      url: toAbsoluteUrl(baseUrl, `/album/${item.slug}`),
      lastModified: item.shootingDate ? new Date(item.shootingDate) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...posts.map((item) => ({
      url: toAbsoluteUrl(baseUrl, `/tin-tuc/${item.slug}`),
      lastModified: item.publishedAt ? new Date(item.publishedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...locations.map((item) => ({
      url: toAbsoluteUrl(baseUrl, `/dia-diem/${item.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

async function getAllPackages(): Promise<PublicPackageListItem[]> {
  try {
    return await getPaginated((page) => getPackages({ page, limit: 100 }));
  } catch {
    return [];
  }
}

async function getAllAlbums(): Promise<PublicAlbumListItem[]> {
  try {
    return await getPaginated((page) => getAlbums({ page, limit: 100 }));
  } catch {
    return [];
  }
}

async function getAllPosts(): Promise<PublicPostListItem[]> {
  try {
    return await getPaginated((page) => getPosts({ page, limit: 100 }));
  } catch {
    return [];
  }
}

async function getAllLocations(): Promise<PublicLocationListItem[]> {
  try {
    return await getLocations({ revalidate });
  } catch {
    return [];
  }
}

async function getPaginated<T>(
  loadPage: (page: number) => Promise<{
    success: true;
    data: T[];
    pagination: { totalPages: number };
  } | null>,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await loadPage(page);

    if (!response?.success) {
      break;
    }

    items.push(...response.data);
    totalPages = response.pagination.totalPages || 0;
    page += 1;
  } while (page <= totalPages);

  return items;
}

function toAbsoluteUrl(baseUrl: string, path: string): string {
  return new URL(path, baseUrl).toString();
}
