import { apiRequest } from "./client";

export type PostStatus = "draft" | "published" | "hidden";

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface PostMediaPreview {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  originalName: string;
}

export interface AdminPost {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  category: CategorySummary | null;
  coverMediaId: string | null;
  cover: PostMediaPreview | null;
  excerpt: string;
  contentHtml: string;
  tags: string[];
  status: PostStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  sortOrder: number;
  seo: {
    title: string;
    description: string;
    ogImageMediaId: string | null;
    ogImage: PostMediaPreview | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PostInput {
  title: string;
  slug?: string;
  categoryId: string;
  coverMediaId?: string | null;
  excerpt?: string;
  contentHtml?: string;
  tags?: string[];
  status?: PostStatus;
  isFeatured?: boolean;
  publishedAt?: string | null;
  sortOrder?: number;
  seo?: {
    title?: string;
    description?: string;
    ogImageMediaId?: string | null;
  };
}

interface PostListResponse {
  success: true;
  data: AdminPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PostResponse {
  success: true;
  data: AdminPost;
}

interface SuccessResponse {
  success: true;
}

export function getPosts(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: PostStatus | "";
    isFeatured?: boolean;
    tag?: string;
    sort?: string;
  } = {},
): Promise<PostListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.categoryId) {
    searchParams.set("categoryId", params.categoryId);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.isFeatured !== undefined) {
    searchParams.set("isFeatured", String(params.isFeatured));
  }

  if (params.tag) {
    searchParams.set("tag", params.tag);
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  const query = searchParams.toString();

  return apiRequest<PostListResponse>(
    `/admin/posts${query ? `?${query}` : ""}`,
  );
}

export function getPostById(id: string): Promise<PostResponse> {
  return apiRequest<PostResponse>(`/admin/posts/${id}`);
}

export function createPost(input: PostInput): Promise<PostResponse> {
  return apiRequest<PostResponse>("/admin/posts", {
    method: "POST",
    body: input,
  });
}

export function updatePost(
  id: string,
  input: PostInput,
): Promise<PostResponse> {
  return apiRequest<PostResponse>(`/admin/posts/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deletePost(id: string): Promise<SuccessResponse> {
  return apiRequest<SuccessResponse>(`/admin/posts/${id}`, {
    method: "DELETE",
  });
}
