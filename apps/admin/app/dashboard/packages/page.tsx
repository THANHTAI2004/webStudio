"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getMediaAssetUrl } from "@/lib/api/media";
import {
  type AdminPackage,
  deletePackage,
  getPackages,
  type PackageStatus,
} from "@/lib/api/packages";
import {
  type PackageCategory,
  getPackageCategories,
} from "@/lib/api/package-categories";
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
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<PackageStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminPackage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [packageResponse, categoryResponse] = await Promise.all([
        withAuthRefresh(
          () =>
            getPackages({
              page,
              limit: PAGE_SIZE,
              search: search.trim(),
              categoryId,
              status,
              sort: "createdAt:desc",
            }),
          redirectToLogin,
        ),
        withAuthRefresh(getPackageCategories, redirectToLogin),
      ]);

      if (!packageResponse || !categoryResponse) {
        return;
      }

      setPackages(packageResponse.data);
      setTotalPages(packageResponse.pagination.totalPages);
      setCategories(categoryResponse.data);
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, loadErrorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, page, redirectToLogin, search, status]);

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
      await withAuthRefresh(
        () => deletePackage(deleteTarget.id),
        redirectToLogin,
      );
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
            Gói chụp
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Gói chụp
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/dashboard/package-categories"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
          >
            Quản lý danh mục
          </Link>
          <Link
            href="/dashboard/packages/new"
            className="rounded-md bg-zinc-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Thêm gói chụp
          </Link>
        </div>
      </header>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_180px]">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Tìm gói chụp"
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
            setStatus(event.target.value as PackageStatus | "");
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">{publishStatusLabels.draft}</option>
          <option value="published">{publishStatusLabels.published}</option>
          <option value="hidden">{publishStatusLabels.hidden}</option>
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
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-normal text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Ảnh đại diện</th>
              <th className="px-4 py-3 font-semibold">Tên</th>
              <th className="px-4 py-3 font-semibold">Danh mục</th>
              <th className="px-4 py-3 font-semibold">Giá</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Nổi bật</th>
              <th className="px-4 py-3 font-semibold">Cập nhật lần cuối</th>
              <th className="px-4 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {!isLoading && packages.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  Không tìm thấy kết quả.
                </td>
              </tr>
            ) : null}

            {packages.map((packageItem) => (
              <tr key={packageItem.id}>
                <td className="px-4 py-3">
                  {packageItem.thumbnail ? (
                    <div className="relative h-16 w-20 overflow-hidden rounded-md bg-zinc-100">
                      <Image
                        src={getMediaAssetUrl(packageItem.thumbnail.url)}
                        alt={
                          packageItem.thumbnail.alt ||
                          packageItem.thumbnail.originalName
                        }
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
                  <p className="font-semibold">{packageItem.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {packageItem.slug}
                  </p>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {packageItem.category?.name ?? unassignedLabel}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">
                    {currencyFormatter.format(
                      packageItem.salePrice ?? packageItem.price,
                    )}
                  </p>
                  {packageItem.salePrice !== null ? (
                    <p className="mt-1 text-xs text-zinc-500 line-through">
                      {currencyFormatter.format(packageItem.price)}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {publishStatusLabels[packageItem.status]}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {yesNoLabel(packageItem.isFeatured)}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatAdminDateTime(packageItem.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/packages/${packageItem.id}/edit`}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold transition hover:bg-zinc-50"
                    >
                      Chỉnh sửa
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(packageItem)}
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
        title="Xóa gói chụp?"
        description={
          <>
            Bạn có chắc muốn xóa{" "}
            <span className="font-semibold text-zinc-900">
              {deleteTarget?.name}
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
