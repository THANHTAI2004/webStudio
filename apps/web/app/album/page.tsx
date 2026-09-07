import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getMediaAssetUrl } from "@/lib/api/client";
import { getAlbumCategories } from "@/lib/api/album-categories";
import { getAlbums } from "@/lib/api/albums";

const PAGE_SIZE = 12;
const TITLE = "Album \u1ea3nh";

export const metadata: Metadata = {
  title: `${TITLE} | Studio`,
  description: "Bo suu tap album anh da duoc Studio cong khai.",
  alternates: {
    canonical: getCanonicalPath("/album"),
  },
};

interface AlbumListPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AlbumListPage({
  searchParams,
}: AlbumListPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const category = getFirstParam(resolvedSearchParams.category);
  const search = getFirstParam(resolvedSearchParams.search);
  const page = Math.max(
    Number(getFirstParam(resolvedSearchParams.page) ?? 1),
    1,
  );
  const [categories, albumResponse] = await Promise.all([
    getAlbumCategories(),
    getAlbums({
      page,
      limit: PAGE_SIZE,
      category,
      search,
    }),
  ]);
  const albums = albumResponse?.data ?? [];
  const pagination = albumResponse?.pagination ?? {
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
            href="/album"
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
              href={`/album?category=${item.slug}`}
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

        {albums.length === 0 ? (
          <p className="mt-10 rounded-lg border border-zinc-200 bg-white px-5 py-8 text-sm text-zinc-600">
            Chua co album phu hop.
          </p>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {albums.map((album) => (
            <article
              key={album.id}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
            >
              <Link
                href={`/album/${album.slug}`}
                className="relative block aspect-[4/3] bg-zinc-100"
              >
                {album.cover ? (
                  <Image
                    src={getMediaAssetUrl(album.cover.url)}
                    alt={album.cover.alt || album.title}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Studio Album
                  </span>
                )}
              </Link>
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                  {album.category ? (
                    <p className="font-medium text-emerald-700">
                      {album.category.name}
                    </p>
                  ) : null}
                  {album.shootingDate ? (
                    <p>{formatDate(album.shootingDate)}</p>
                  ) : null}
                </div>
                <h2 className="mt-2 text-xl font-semibold">
                  <Link href={`/album/${album.slug}`}>{album.title}</Link>
                </h2>
                {album.location ? (
                  <p className="mt-2 text-sm font-medium text-zinc-600">
                    {album.location}
                  </p>
                ) : null}
                {album.description ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
                    {album.description}
                  </p>
                ) : null}
                <Link
                  href={`/album/${album.slug}`}
                  className="mt-5 inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold transition hover:bg-zinc-50"
                >
                  Xem album
                </Link>
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
  const href = createAlbumListHref({
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

function createAlbumListHref(params: {
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

  return `/album${query ? `?${query}` : ""}`;
}

function getFirstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getCanonicalPath(path: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl).toString();
}
