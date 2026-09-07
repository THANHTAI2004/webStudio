import { getApiBaseUrl } from "./client";

export interface PostCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface PostCategoriesResponse {
  success: true;
  data: PostCategory[];
}

export async function getPostCategories(): Promise<PostCategory[]> {
  const response = await fetch(`${getApiBaseUrl()}/post-categories`, {
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response
    .json()
    .catch(() => null)) as PostCategoriesResponse | null;

  return payload?.success ? payload.data : [];
}
