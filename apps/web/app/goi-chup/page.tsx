import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getMediaAssetUrl } from "@/lib/api/client";
import { getPackageCategories } from "@/lib/api/package-categories";
import { getPackages } from "@/lib/api/packages";

const PAGE_SIZE = 9;
const TITLE = "G\u00f3i ch\u1ee5p";
const DETAIL_CTA = "Xem chi ti\u1ebft";
const BOOKING_CTA = "\u0110\u1eb7t l\u1ecbch";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export const metadata: Metadata = {
  title: `${TITLE} | Studio Website`,
  description: "Danh sach cac goi chup anh dang duoc Studio cong khai.",
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
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="border-b border-zinc-200 pb-7">
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Studio
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal">
            {TITLE}
          </h1>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/goi-chup"
            className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
              category
                ? "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                : "border-zinc-950 bg-zinc-950 text-white"
            }`}
          >
            Tat ca
          </Link>
          {categories.map((item) => (
            <Link
              key={item.id}
              href={`/goi-chup?category=${item.slug}`}
              className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                category === item.slug
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {packages.length === 0 ? (
          <p className="mt-10 rounded-lg border border-zinc-200 bg-white px-5 py-8 text-sm text-zinc-600">
            Chua co goi chup phu hop.
          </p>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((packageItem) => (
            <article
              key={packageItem.id}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
            >
              <Link
                href={`/goi-chup/${packageItem.slug}`}
                className="relative block aspect-[4/3] bg-zinc-100"
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
                  <span className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Studio Package
                  </span>
                )}
              </Link>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-emerald-700">
                    {packageItem.category?.name ?? "Studio"}
                  </p>
                  {packageItem.durationMinutes ? (
                    <p className="text-sm text-zinc-500">
                      {packageItem.durationMinutes} min
                    </p>
                  ) : null}
                </div>
                <h2 className="mt-2 text-xl font-semibold">
                  <Link href={`/goi-chup/${packageItem.slug}`}>
                    {packageItem.name}
                  </Link>
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
                  {packageItem.description}
                </p>
                <div className="mt-5 flex items-end gap-3">
                  <p className="text-lg font-semibold">
                    {currencyFormatter.format(
                      packageItem.salePrice ?? packageItem.price,
                    )}
                  </p>
                  {packageItem.salePrice !== null ? (
                    <p className="text-sm text-zinc-500 line-through">
                      {currencyFormatter.format(packageItem.price)}
                    </p>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/goi-chup/${packageItem.slug}`}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold transition hover:bg-zinc-50"
                  >
                    {DETAIL_CTA}
                  </Link>
                  <Link
                    href={`/dat-lich?package=${packageItem.slug}`}
                    className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    {BOOKING_CTA}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-end gap-3">
          <PaginationLink
            disabled={pagination.page <= 1}
            page={pagination.page - 1}
            category={category}
            search={search}
          >
            Previous
          </PaginationLink>
          <span className="min-w-20 text-center text-sm text-zinc-600">
            {pagination.page} / {Math.max(pagination.totalPages, 1)}
          </span>
          <PaginationLink
            disabled={
              pagination.totalPages === 0 ||
              pagination.page >= pagination.totalPages
            }
            page={pagination.page + 1}
            category={category}
            search={search}
          >
            Next
          </PaginationLink>
        </div>
      </section>
    </main>
  );
}

function PaginationLink({
  disabled,
  page,
  category,
  search,
  children,
}: {
  disabled: boolean;
  page: number;
  category?: string;
  search?: string;
  children: ReactNode;
}) {
  const href = createPackageListHref({
    page,
    category,
    search,
  });

  if (disabled) {
    return (
      <span className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-400">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold transition hover:bg-zinc-50"
    >
      {children}
    </Link>
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
