import { getApiBaseUrl } from "./client";

export interface PackageCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface PackageCategoriesResponse {
  success: true;
  data: PackageCategory[];
}

export async function getPackageCategories(): Promise<PackageCategory[]> {
  const response = await fetch(`${getApiBaseUrl()}/package-categories`, {
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response
    .json()
    .catch(() => null)) as PackageCategoriesResponse | null;

  return payload?.success ? payload.data : [];
}
