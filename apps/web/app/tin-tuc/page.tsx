import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getMediaAssetUrl } from "@/lib/api/client";
import { getPostCategories } from "@/lib/api/post-categories";
import { getPosts, type PublicPostListItem } from "@/lib/api/posts";

const PAGE_SIZE = 12;
const TITLE = "Tin t\u1ee9c";

export const metadata: Metadata = {
  title: `${TITLE} | Studio`,
  description:
    "Kinh nghi\u1ec7m v\u00e0 c\u00e2u chuy\u1ec7n h\u1eadu tr\u01b0\u1eddng t\u1eeb Studio.",
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
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="border-b border-zinc-200 pb-7">
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Studio
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal">
            {TITLE}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            Kinh nghi\u1ec7m chu\u1ea9n b\u1ecb bu\u1ed5i ch\u1ee5p, \u00fd t\u01b0\u1edfng
            h\u00ecnh \u1ea3nh v\u00e0 nh\u1eefng c\u00e2u chuy\u1ec7n \u0111\u1eb1ng sau
            c\u00e1c b\u1ed9 \u1ea3nh c\u1ee7a Studio.
          </p>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/tin-tuc"
            className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
              category
                ? "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                : "border-zinc-950 bg-zinc-950 text-white"
            }`}
          >
            T\u1ea5t c\u1ea3
          </Link>
          {categories.map((item) => (
            <Link
              key={item.id}
              href={`/tin-tuc?category=${item.slug}`}
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

        {featuredPosts.length > 0 ? (
          <section className="border-b border-zinc-200 py-10">
            <h2 className="text-2xl font-semibold tracking-normal">
              N\u1ed5i b\u1eadt
            </h2>
            <div className="mt-5 grid gap-6 lg:grid-cols-3">
              {featuredPosts.map((post) => (
                <PostCard key={post.id} post={post} featured />
              ))}
            </div>
          </section>
        ) : null}

        {posts.length === 0 ? (
          <p className="mt-10 rounded-lg border border-zinc-200 bg-white px-5 py-8 text-sm text-zinc-600">
            Ch\u01b0a c\u00f3 b\u00e0i vi\u1ebft ph\u00f9 h\u1ee3p.
          </p>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="mt-10 flex items-center justify-end gap-3">
          <PaginationLink
            disabled={pagination.page <= 1}
            page={pagination.page - 1}
            category={category}
            tag={tag}
            search={search}
          >
            Tr\u01b0\u1edbc
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
            tag={tag}
            search={search}
          >
            Sau
          </PaginationLink>
        </div>
      </section>
    </main>
  );
}

function PostCard({
  post,
  featured = false,
}: {
  post: PublicPostListItem;
  featured?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <Link
        href={`/tin-tuc/${post.slug}`}
        className="relative block aspect-[4/3] bg-zinc-100"
      >
        {post.cover ? (
          <Image
            src={getMediaAssetUrl(post.cover.url)}
            alt={post.cover.alt || post.title}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-zinc-500">
            Tin t\u1ee9c Studio
          </span>
        )}
      </Link>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          {post.category ? (
            <p className="font-medium text-emerald-700">{post.category.name}</p>
          ) : null}
          {post.publishedAt ? <p>{formatDate(post.publishedAt)}</p> : null}
          {featured ? (
            <p className="font-medium text-zinc-700">N\u1ed5i b\u1eadt</p>
          ) : null}
        </div>
        <h2 className="mt-2 text-xl font-semibold">
          <Link href={`/tin-tuc/${post.slug}`}>{post.title}</Link>
        </h2>
        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
            {post.excerpt}
          </p>
        ) : null}
        {post.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/tin-tuc?tag=${encodeURIComponent(tag)}`}
                className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-500 hover:bg-zinc-50"
              >
                {tag}
              </Link>
            ))}
          </div>
        ) : null}
        <Link
          href={`/tin-tuc/${post.slug}`}
          className="mt-5 inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold transition hover:bg-zinc-50"
        >
          \u0110\u1ecdc b\u00e0i vi\u1ebft
        </Link>
      </div>
    </article>
  );
}

function PaginationLink({
  disabled,
  page,
  category,
  tag,
  search,
  children,
}: {
  disabled: boolean;
  page: number;
  category?: string;
  tag?: string;
  search?: string;
  children: ReactNode;
}) {
  const href = createNewsListHref({
    page,
    category,
    tag,
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getCanonicalPath(path: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return path;
  }

  return new URL(path, siteUrl).toString();
}
