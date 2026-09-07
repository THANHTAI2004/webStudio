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

export interface PublicPackageSeo {
  title: string;
  description: string;
  ogImage: PublicMediaPreview | null;
}

export interface PublicPackageListItem {
  id: string;
  name: string;
  slug: string;
  category: CategorySummary | null;
  thumbnail: PublicMediaPreview | null;
  price: number;
  salePrice: number | null;
  durationMinutes: number | null;
  features: string[];
  description: string;
  seo: PublicPackageSeo;
}

export interface PublicPackageDetail extends PublicPackageListItem {
  gallery: PublicMediaPreview[];
  content: string;
}

export interface PackagePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PackageListResponse {
  success: true;
  data: PublicPackageListItem[];
  pagination: PackagePagination;
}

interface PackageDetailResponse {
  success: true;
  data: PublicPackageDetail;
}

export async function getPackages(params: {
  page?: number;
  limit?: number;
  category?: string;
  featured?: boolean;
  search?: string;
}, options?: {
  cache?: RequestCache;
}): Promise<PackageListResponse | null> {
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

  if (params.featured !== undefined) {
    searchParams.set("featured", String(params.featured));
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();
  const requestOptions = options?.cache
    ? { cache: options.cache }
    : {
        next: {
          revalidate: 60,
        },
      };
  const response = await fetch(
    `${getApiBaseUrl()}/packages${query ? `?${query}` : ""}`,
    requestOptions,
  );

  if (!response.ok) {
    return null;
  }

  return (await response
    .json()
    .catch(() => null)) as PackageListResponse | null;
}

export async function getPackageBySlug(
  slug: string,
): Promise<PublicPackageDetail | null> {
  const response = await fetch(`${getApiBaseUrl()}/packages/${slug}`, {
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response
    .json()
    .catch(() => null)) as PackageDetailResponse | null;

  return payload?.success ? payload.data : null;
}
