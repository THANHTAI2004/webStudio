import { getApiBaseUrl } from "./client";

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface PublicMediaPreview {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface PublicPostSeo {
  title: string;
  description: string;
  ogImage: PublicMediaPreview | null;
}

export interface PublicPostListItem {
  id: string;
  title: string;
  slug: string;
  category: CategorySummary | null;
  cover: PublicMediaPreview | null;
  excerpt: string;
  tags: string[];
  publishedAt: string | null;
}

export interface PublicPostDetail extends PublicPostListItem {
  contentHtml: string;
  seo: PublicPostSeo;
  updatedAt: string;
}

export interface PostPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PostListResponse {
  success: true;
  data: PublicPostListItem[];
  pagination: PostPagination;
}

interface PostDetailResponse {
  success: true;
  data: PublicPostDetail;
}

export async function getPosts(params: {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  featured?: boolean;
  search?: string;
}): Promise<PostListResponse | null> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.tag) {
    searchParams.set("tag", params.tag);
  }

  if (params.featured !== undefined) {
    searchParams.set("featured", String(params.featured));
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();
  const response = await fetch(
    `${getApiBaseUrl()}/posts${query ? `?${query}` : ""}`,
    {
      next: {
        revalidate: 60,
      },
    },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json().catch(() => null)) as PostListResponse | null;
}

export async function getPostBySlug(
  slug: string,
): Promise<PublicPostDetail | null> {
  const response = await fetch(`${getApiBaseUrl()}/posts/${slug}`, {
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response
    .json()
    .catch(() => null)) as PostDetailResponse | null;

  return payload?.success ? payload.data : null;
}
