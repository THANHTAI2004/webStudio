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
import {
  deleteErrorMessage,
  emptyLabel,
  formatAdminDateTime,
  getAdminErrorMessage,
  loadErrorMessage,
  publishStatusLabels,
  unassignedLabel,
  yesNoLabel,
} from "@/lib/admin-labels";
import { withAuthRefresh } from "@/lib/api/session";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null);
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
      setError(getAdminErrorMessage(caughtError, loadErrorMessage));
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

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await withAuthRefresh(() => deletePost(deleteTarget.id), redirectToLogin);
      setDeleteTarget(null);
      await loadData();
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, deleteErrorMessage));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Bài viết
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Bài viết
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/dashboard/post-categories"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
          >
            Quản lý danh mục
          </Link>
          <Link
            href="/dashboard/posts/new"
            className="rounded-md bg-zinc-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Thêm bài viết
          </Link>
        </div>
      </header>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_190px_150px_150px_160px_190px]">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Tìm bài viết"
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
          <option value="">Tất cả danh mục</option>
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
          <option value="">Tất cả trạng thái</option>
          <option value="draft">{publishStatusLabels.draft}</option>
          <option value="published">{publishStatusLabels.published}</option>
          <option value="hidden">{publishStatusLabels.hidden}</option>
        </select>
        <select
          value={featured}
          onChange={(event) => {
            setPage(1);
            setFeatured(event.target.value);
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">Tất cả nổi bật</option>
          <option value="true">Nổi bật</option>
          <option value="false">Không nổi bật</option>
        </select>
        <input
          value={tag}
          onChange={(event) => {
            setPage(1);
            setTag(event.target.value);
          }}
          placeholder="Thẻ"
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
          <option value="createdAt:desc">Mới nhất</option>
          <option value="createdAt:asc">Cũ nhất</option>
          <option value="publishedAt:desc">Ngày đăng mới nhất</option>
          <option value="publishedAt:asc">Ngày đăng cũ nhất</option>
          <option value="sortOrder:asc">Thứ tự hiển thị</option>
        </select>
      </div>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-sm text-zinc-600">Đang tải...</p>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-normal text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Ảnh bìa</th>
              <th className="px-4 py-3 font-semibold">Tiêu đề</th>
              <th className="px-4 py-3 font-semibold">Danh mục</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Ngày đăng</th>
              <th className="px-4 py-3 font-semibold">Nổi bật</th>
              <th className="px-4 py-3 font-semibold">Cập nhật lần cuối</th>
              <th className="px-4 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {!isLoading && posts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  Không tìm thấy kết quả.
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
                      {emptyLabel}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{post.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{post.slug}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {post.category?.name ?? unassignedLabel}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {publishStatusLabels[post.status]}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {post.publishedAt
                    ? formatAdminDateTime(post.publishedAt)
                    : emptyLabel}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {yesNoLabel(post.isFeatured)}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatAdminDateTime(post.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/posts/${post.id}/edit`}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold transition hover:bg-zinc-50"
                    >
                      Chỉnh sửa
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(post)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Xóa
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
          Trước
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
          Sau
        </button>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xóa bài viết?"
        description={
          <>
            Bạn có chắc muốn xóa{" "}
            <span className="font-semibold text-zinc-900">
              {deleteTarget?.title}
            </span>
            ? Thao tác này không thể hoàn tác.
          </>
        }
        isLoading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </section>
  );
}
