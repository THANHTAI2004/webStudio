"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getMediaAssetUrl } from "@/lib/api/media";
import {
  type AdminLocation,
  deleteLocation,
  getLocations,
} from "@/lib/api/locations";
import {
  deleteErrorMessage,
  emptyLabel,
  getAdminErrorMessage,
  loadErrorMessage,
  yesNoLabel,
} from "@/lib/admin-labels";
import { withAuthRefresh } from "@/lib/api/session";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const PAGE_SIZE = 20;

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<boolean | "">("");
  const [featured, setFeatured] = useState<boolean | "">("");
  const [sort, setSort] = useState("sortOrder:asc");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await withAuthRefresh(
        () =>
          getLocations({
            page,
            limit: PAGE_SIZE,
            search: search.trim(),
            active,
            featured,
            sort,
          }),
        redirectToLogin,
      );

      if (!response) {
        return;
      }

      setLocations(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, loadErrorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [active, featured, page, redirectToLogin, search, sort]);

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
        () => deleteLocation(deleteTarget.id),
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
            Cơ sở
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Cơ sở
          </h1>
        </div>
        <Link
          href="/dashboard/locations/new"
          className="rounded-md bg-zinc-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Thêm cơ sở
        </Link>
      </header>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_170px_170px_190px]">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Tìm tên, địa chỉ, số điện thoại"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
        <select
          value={String(active)}
          onChange={(event) => {
            setPage(1);
            setActive(toOptionalBoolean(event.target.value));
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">Tất cả hiển thị</option>
          <option value="true">Đang hiển thị</option>
          <option value="false">Đã ẩn</option>
        </select>
        <select
          value={String(featured)}
          onChange={(event) => {
            setPage(1);
            setFeatured(toOptionalBoolean(event.target.value));
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">Tất cả nổi bật</option>
          <option value="true">Nổi bật</option>
          <option value="false">Không nổi bật</option>
        </select>
        <select
          value={sort}
          onChange={(event) => {
            setPage(1);
            setSort(event.target.value);
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="sortOrder:asc">Thứ tự hiển thị</option>
          <option value="createdAt:desc">Mới nhất</option>
          <option value="name:asc">Tên A-Z</option>
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
              <th className="px-4 py-3 font-semibold">Ảnh bìa</th>
              <th className="px-4 py-3 font-semibold">Tên</th>
              <th className="px-4 py-3 font-semibold">Địa chỉ</th>
              <th className="px-4 py-3 font-semibold">Số điện thoại</th>
              <th className="px-4 py-3 font-semibold">Hiển thị</th>
              <th className="px-4 py-3 font-semibold">Nổi bật</th>
              <th className="px-4 py-3 font-semibold">Thứ tự</th>
              <th className="px-4 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {!isLoading && locations.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  Không tìm thấy kết quả.
                </td>
              </tr>
            ) : null}

            {locations.map((location) => (
              <tr key={location.id}>
                <td className="px-4 py-3">
                  {location.cover ? (
                    <div className="relative h-16 w-20 overflow-hidden rounded-md bg-zinc-100">
                      <Image
                        src={getMediaAssetUrl(location.cover.url)}
                        alt={location.cover.alt || location.name}
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
                  <p className="font-semibold">{location.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{location.slug}</p>
                </td>
                <td className="max-w-sm px-4 py-3 text-zinc-600">
                  <p className="line-clamp-2">{location.address}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600">{location.phone}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {yesNoLabel(location.isActive)}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {yesNoLabel(location.isFeatured)}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {location.sortOrder}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/locations/${location.id}/edit`}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold transition hover:bg-zinc-50"
                    >
                      Chỉnh sửa
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(location)}
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
        title="Xóa cơ sở?"
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

function toOptionalBoolean(value: string): boolean | "" {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return "";
}
