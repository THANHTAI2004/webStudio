"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getMediaAssetUrl } from "@/lib/api/media";
import {
  type AdminPost,
  type PostStatus,
  deletePost,
  getPosts,
} from "@/lib/api/posts";
import {
  type PostCategory,
  getPostCategories,
} from "@/lib/api/post-categories";
import { withAuthRefresh } from "@/lib/api/session";

const PAGE_SIZE = 20;

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<PostStatus | "">("");
  const [featured, setFeatured] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("createdAt:desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [postResponse, categoryResponse] = await Promise.all([
        withAuthRefresh(
          () =>
            getPosts({
              page,
              limit: PAGE_SIZE,
              search: search.trim(),
              categoryId,
              status,
              isFeatured: featured === "" ? undefined : featured === "true",
              tag: tag.trim(),
              sort,
            }),
          redirectToLogin,
        ),
        withAuthRefresh(getPostCategories, redirectToLogin),
      ]);

      if (!postResponse || !categoryResponse) {
        return;
      }

      setPosts(postResponse.data);
      setTotalPages(postResponse.pagination.totalPages);
      setCategories(categoryResponse.data);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to load posts."));
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, featured, page, redirectToLogin, search, sort, status, tag]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadData]);

  async function handleDelete(post: AdminPost) {
    const confirmed = window.confirm(`Delete post "${post.title}"?`);

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await withAuthRefresh(() => deletePost(post.id), redirectToLogin);
      await loadData();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to delete post."));
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Posts
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            News Management
          </h1>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="rounded-md bg-zinc-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          New Post
        </Link>
      </header>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_190px_150px_150px_160px_190px]">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Search by title, slug, or excerpt"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
        <select
          value={categoryId}
          onChange={(event) => {
            setPage(1);
            setCategoryId(event.target.value);
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value as PostStatus | "");
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">All status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
        <select
          value={featured}
          onChange={(event) => {
            setPage(1);
            setFeatured(event.target.value);
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">All featured</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </select>
        <input
          value={tag}
          onChange={(event) => {
            setPage(1);
            setTag(event.target.value);
          }}
          placeholder="Tag"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
        <select
          value={sort}
          onChange={(event) => {
            setPage(1);
            setSort(event.target.value);
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="createdAt:desc">Newest</option>
          <option value="createdAt:asc">Oldest</option>
          <option value="publishedAt:desc">Published desc</option>
          <option value="publishedAt:asc">Published asc</option>
          <option value="sortOrder:asc">Sort order asc</option>
        </select>
      </div>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-sm text-zinc-600">Loading posts...</p>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-normal text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Cover</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Published At</th>
              <th className="px-4 py-3 font-semibold">Featured</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {!isLoading && posts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  No posts found.
                </td>
              </tr>
            ) : null}

            {posts.map((post) => (
              <tr key={post.id}>
                <td className="px-4 py-3">
                  {post.cover ? (
                    <div className="relative h-16 w-20 overflow-hidden rounded-md bg-zinc-100">
                      <Image
                        src={getMediaAssetUrl(post.cover.url)}
                        alt={post.cover.alt || post.cover.originalName}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-20 items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-500">
                      Empty
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{post.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{post.slug}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {post.category?.name ?? "Unassigned"}
                </td>
                <td className="px-4 py-3 text-zinc-600">{post.status}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {post.publishedAt ? formatDate(post.publishedAt) : "Empty"}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {post.isFeatured ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatDate(post.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/posts/${post.id}/edit`}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold transition hover:bg-zinc-50"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(post)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={page <= 1 || isLoading}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
        >
          Previous
        </button>
        <span className="min-w-20 text-center text-sm text-zinc-600">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          disabled={totalPages === 0 || page >= totalPages || isLoading}
          onClick={() => setPage((value) => value + 1)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
        >
          Next
        </button>
      </div>
    </section>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
