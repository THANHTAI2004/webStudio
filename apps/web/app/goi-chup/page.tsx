import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CategoryFilter,
  EmptyState,
  PageHero,
  PaginationControls,
  currencyFormatter,
} from "@/components/ui/public-ui";
import { getMediaAssetUrl } from "@/lib/api/client";
import { getPackageCategories } from "@/lib/api/package-categories";
import { getPackages, type PublicPackageListItem } from "@/lib/api/packages";

const PAGE_SIZE = 9;
const TITLE = "Gói chụp";

export const metadata: Metadata = {
  title: `${TITLE} | Studio`,
  description:
    "Các gói chụp ảnh được thiết kế rõ ràng để bạn chọn đúng trải nghiệm phù hợp.",
  alternates: {
    canonical: getCanonicalPath("/goi-chup"),
  },
};

interface PackageListPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PackageListPage({
  searchParams,
}: PackageListPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const category = getFirstParam(resolvedSearchParams.category);
  const search = getFirstParam(resolvedSearchParams.search);
  const page = Math.max(
    Number(getFirstParam(resolvedSearchParams.page) ?? 1),
    1,
  );
  const [categories, packageResponse] = await Promise.all([
    getPackageCategories(),
    getPackages({
      page,
      limit: PAGE_SIZE,
      category,
      search,
    }),
  ]);
  const packages = packageResponse?.data ?? [];
  const pagination = packageResponse?.pagination ?? {
    page,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };

  return (
    <main>
      <PageHero
        eyebrow="Dịch vụ"
        title={TITLE}
        description="Chọn gói chụp theo nhu cầu, phong cách và ngân sách. Mỗi gói đều có mô tả rõ ràng để bạn dễ hình dung buổi chụp trước khi đặt lịch."
      />

      <section className="public-section">
        <div className="site-container">
          <CategoryFilter
            basePath="/goi-chup"
            activeCategory={category}
            items={categories}
          />

          {packages.length === 0 ? (
            <EmptyState
              title="Hiện chưa có gói chụp phù hợp."
              description="Bạn có thể đổi danh mục lọc hoặc quay lại sau khi Studio cập nhật thêm dịch vụ mới."
              actionHref="/goi-chup"
              actionLabel="Xem tất cả gói chụp"
            />
          ) : null}

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((packageItem) => (
              <PackageCard key={packageItem.id} packageItem={packageItem} />
            ))}
          </div>

          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            previousHref={createPackageListHref({
              page: pagination.page - 1,
              category,
              search,
            })}
            nextHref={createPackageListHref({
              page: pagination.page + 1,
              category,
              search,
            })}
          />
        </div>
      </section>
    </main>
  );
}

function PackageCard({
  packageItem,
}: {
  packageItem: PublicPackageListItem;
}) {
  return (
    <article className="public-card">
      <Link
        href={`/goi-chup/${packageItem.slug}`}
        className="image-link aspect-[4/3]"
      >
        {packageItem.thumbnail ? (
          <Image
            src={getMediaAssetUrl(packageItem.thumbnail.url)}
            alt={packageItem.thumbnail.alt || packageItem.name}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="media-fallback">Gói chụp</span>
        )}
      </Link>
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="section-eyebrow">
            {packageItem.category?.name ?? "Dịch vụ"}
          </p>
          {packageItem.durationMinutes ? (
            <p className="text-xs font-bold text-[var(--color-muted)]">
              {packageItem.durationMinutes} phút
            </p>
          ) : null}
        </div>
        <h2
          className="mt-3 text-2xl font-semibold leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Link href={`/goi-chup/${packageItem.slug}`}>{packageItem.name}</Link>
        </h2>
        {packageItem.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--color-muted)]">
            {packageItem.description}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <p className="text-xl font-semibold">
            {currencyFormatter.format(packageItem.salePrice ?? packageItem.price)}
          </p>
          {packageItem.salePrice !== null ? (
            <p className="text-sm text-[var(--color-muted)] line-through">
              {currencyFormatter.format(packageItem.price)}
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/goi-chup/${packageItem.slug}`}
            className="theme-button-secondary"
          >
            Xem chi tiết
          </Link>
          <Link
            href={`/dat-lich?package=${packageItem.slug}`}
            className="theme-button-primary"
          >
            Đặt lịch
          </Link>
        </div>
      </div>
    </article>
  );
}

function createPackageListHref(params: {
  page: number;
  category?: string;
  search?: string;
}): string {
  const searchParams = new URLSearchParams();

  if (params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();

  return `/goi-chup${query ? `?${query}` : ""}`;
}

function getFirstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getCanonicalPath(path: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl).toString();
}
