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
import { getMediaAssetUrl } from "@/lib/api/client";
import { getPostCategories } from "@/lib/api/post-categories";
import { getPosts, type PublicPostListItem } from "@/lib/api/posts";

const PAGE_SIZE = 12;
const TITLE = "Bài viết";

export const metadata: Metadata = {
  title: `${TITLE} | Studio`,
  description:
    "Kinh nghiệm chuẩn bị buổi chụp, ý tưởng hình ảnh và câu chuyện hậu trường từ Studio.",
  alternates: {
    canonical: getCanonicalPath("/tin-tuc"),
  },
};

interface NewsListPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewsListPage({
  searchParams,
}: NewsListPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const category = getFirstParam(resolvedSearchParams.category);
  const tag = getFirstParam(resolvedSearchParams.tag);
  const search = getFirstParam(resolvedSearchParams.search);
  const page = Math.max(
    Number(getFirstParam(resolvedSearchParams.page) ?? 1),
    1,
  );
  const [categories, featuredResponse, postResponse] = await Promise.all([
    getPostCategories(),
    getPosts({
      page: 1,
      limit: 3,
      category,
      featured: true,
    }),
    getPosts({
      page,
      limit: PAGE_SIZE,
      category,
      tag,
      search,
    }),
  ]);
  const featuredPosts = featuredResponse?.data ?? [];
  const posts = postResponse?.data ?? [];
  const pagination = postResponse?.pagination ?? {
    page,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };

  return (
    <main>
      <PageHero
        eyebrow="Góc Studio"
        title={TITLE}
        description="Những ghi chú hữu ích trước buổi chụp, câu chuyện hậu trường và cảm hứng hình ảnh được Studio chia sẻ đều đặn."
      />

      <section className="public-section">
        <div className="site-container">
          <CategoryFilter
            basePath="/tin-tuc"
            activeCategory={category}
            items={categories}
          />

          {featuredPosts.length > 0 ? (
            <section className="mt-12 border-b border-[var(--color-border)] pb-12">
              <p className="section-eyebrow">Nổi bật</p>
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <PostCard post={featuredPosts[0]} featured />
                <div className="grid gap-6">
                  {featuredPosts.slice(1).map((post) => (
                    <PostCard key={post.id} post={post} compact />
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {posts.length === 0 ? (
            <EmptyState
              title="Hiện chưa có bài viết phù hợp."
              description="Bạn có thể đổi danh mục lọc hoặc quay lại sau khi Studio cập nhật bài viết mới."
              actionHref="/tin-tuc"
              actionLabel="Xem tất cả bài viết"
            />
          ) : null}

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            previousHref={createNewsListHref({
              page: pagination.page - 1,
              category,
              tag,
              search,
            })}
            nextHref={createNewsListHref({
              page: pagination.page + 1,
              category,
              tag,
              search,
            })}
          />
        </div>
      </section>
    </main>
  );
}

function PostCard({
  post,
  featured = false,
  compact = false,
}: {
  post: PublicPostListItem;
  featured?: boolean;
  compact?: boolean;
}) {
  return (
    <article className={`public-card ${compact ? "grid sm:grid-cols-[180px_1fr]" : ""}`}>
      <Link
        href={`/tin-tuc/${post.slug}`}
        className={`image-link ${featured ? "aspect-[16/10]" : "aspect-[4/3]"} ${
          compact ? "sm:aspect-auto" : ""
        }`}
      >
        {post.cover ? (
          <Image
            src={getMediaAssetUrl(post.cover.url)}
            alt={post.cover.alt || post.title}
            fill
            sizes={
              featured
                ? "(min-width: 1024px) 58vw, 100vw"
                : "(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            }
            className="object-cover"
          />
        ) : (
          <span className="media-fallback">Bài viết</span>
        )}
      </Link>
      <div className={featured ? "p-6 md:p-8" : "p-5 md:p-6"}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="section-eyebrow">{post.category?.name ?? "Bài viết"}</p>
          {post.publishedAt ? (
            <p className="text-xs font-bold text-[var(--color-muted)]">
              {dateFormatter.format(new Date(post.publishedAt))}
            </p>
          ) : null}
        </div>
        <h2
          className={`mt-3 font-semibold leading-tight ${
            featured ? "text-4xl" : "text-2xl"
          }`}
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Link href={`/tin-tuc/${post.slug}`}>{post.title}</Link>
        </h2>
        {post.excerpt ? (
          <p className="mt-4 line-clamp-3 text-sm leading-7 text-[var(--color-muted)]">
            {post.excerpt}
          </p>
        ) : null}
        {post.tags.length > 0 && !compact ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/tin-tuc?tag=${encodeURIComponent(tag)}`}
                className="category-chip min-h-0 px-3 py-1 text-xs"
              >
                {tag}
              </Link>
            ))}
          </div>
        ) : null}
        <Link
          href={`/tin-tuc/${post.slug}`}
          className="mt-6 inline-flex text-sm font-extrabold text-[var(--color-primary)] underline decoration-[var(--color-accent)] underline-offset-4"
        >
          Đọc bài viết
        </Link>
      </div>
    </article>
  );
}

function createNewsListHref(params: {
  page: number;
  category?: string;
  tag?: string;
  search?: string;
}): string {
  const searchParams = new URLSearchParams();

  if (params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.tag) {
    searchParams.set("tag", params.tag);
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();

  return `/tin-tuc${query ? `?${query}` : ""}`;
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
    return path;
  }

  return new URL(path, siteUrl).toString();
}
