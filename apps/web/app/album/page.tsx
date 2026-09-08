import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CategoryFilter,
  EmptyState,
  PageHero,
  PaginationControls,
  dateFormatter,
} from "@/components/ui/public-ui";
import { getAlbumCategories } from "@/lib/api/album-categories";
import { getAlbums, type PublicAlbumListItem } from "@/lib/api/albums";
import { getMediaAssetUrl } from "@/lib/api/client";

const PAGE_SIZE = 12;
const TITLE = "Album ảnh";

export const metadata: Metadata = {
  title: `${TITLE} | Studio`,
  description:
    "Bộ sưu tập hình ảnh đã thực hiện, được trình bày theo phong cách portfolio của Studio.",
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
    <main>
      <PageHero
        eyebrow="Portfolio"
        title={TITLE}
        description="Những bộ ảnh đã được Studio tuyển chọn để bạn cảm nhận phong cách ánh sáng, bố cục và câu chuyện trong từng buổi chụp."
      />

      <section className="public-section">
        <div className="site-container">
          <CategoryFilter
            basePath="/album"
            activeCategory={category}
            items={categories}
          />

          {albums.length === 0 ? (
            <EmptyState
              title="Hiện chưa có album phù hợp."
              description="Bạn có thể đổi danh mục lọc hoặc quay lại sau khi Studio cập nhật thêm bộ ảnh mới."
              actionHref="/album"
              actionLabel="Xem tất cả album"
            />
          ) : null}

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {albums.map((album, index) => (
              <AlbumCard
                key={album.id}
                album={album}
                featured={index === 0 && albums.length > 3}
              />
            ))}
          </div>

          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            previousHref={createAlbumListHref({
              page: pagination.page - 1,
              category,
              search,
            })}
            nextHref={createAlbumListHref({
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

function AlbumCard({
  album,
  featured,
}: {
  album: PublicAlbumListItem;
  featured: boolean;
}) {
  return (
    <article className={`public-card ${featured ? "md:col-span-2" : ""}`}>
      <Link
        href={`/album/${album.slug}`}
        className={`image-link ${featured ? "aspect-[16/9]" : "aspect-[4/3]"}`}
      >
        {album.cover ? (
          <Image
            src={getMediaAssetUrl(album.cover.url)}
            alt={album.cover.alt || album.title}
            fill
            sizes={
              featured
                ? "(min-width: 1280px) 66vw, 100vw"
                : "(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            }
            className="object-cover"
          />
        ) : (
          <span className="media-fallback">Album</span>
        )}
      </Link>
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {album.category ? <p className="section-eyebrow">{album.category.name}</p> : null}
          {album.shootingDate ? (
            <p className="text-xs font-bold text-[var(--color-muted)]">
              {dateFormatter.format(new Date(album.shootingDate))}
            </p>
          ) : null}
        </div>
        <h2
          className="mt-3 text-2xl font-semibold leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Link href={`/album/${album.slug}`}>{album.title}</Link>
        </h2>
        {album.location ? (
          <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">
            {album.location}
          </p>
        ) : null}
        {album.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--color-muted)]">
            {album.description}
          </p>
        ) : null}
        <Link
          href={`/album/${album.slug}`}
          className="mt-6 inline-flex text-sm font-extrabold text-[var(--color-primary)] underline decoration-[var(--color-accent)] underline-offset-4"
        >
          Xem album
        </Link>
      </div>
    </article>
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

function getCanonicalPath(path: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl).toString();
}
