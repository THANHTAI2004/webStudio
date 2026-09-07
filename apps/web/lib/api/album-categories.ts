import { getApiBaseUrl } from "./client";

export interface AlbumCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface AlbumCategoriesResponse {
  success: true;
  data: AlbumCategory[];
}

export async function getAlbumCategories(): Promise<AlbumCategory[]> {
  const response = await fetch(`${getApiBaseUrl()}/album-categories`, {
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response
    .json()
    .catch(() => null)) as AlbumCategoriesResponse | null;

  return payload?.success ? payload.data : [];
}
