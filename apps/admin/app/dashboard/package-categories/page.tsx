"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  type PackageCategory,
  createPackageCategory,
  deletePackageCategory,
  getPackageCategories,
  updatePackageCategory,
} from "@/lib/api/package-categories";
import {
  deleteErrorMessage,
  getAdminErrorMessage,
  loadErrorMessage,
  saveErrorMessage,
} from "@/lib/admin-labels";
import { withAuthRefresh } from "@/lib/api/session";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: string;
}

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
  sortOrder: "0",
};

export default function PackageCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PackageCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await withAuthRefresh(
        getPackageCategories,
        redirectToLogin,
      );

      if (!response) {
        return;
      }

      setCategories(response.data);
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, loadErrorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCategories();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadCategories]);

  const editingCategory = useMemo(
    () => categories.find((category) => category.id === editingId) ?? null,
    [categories, editingId],
  );

  function startEdit(category: PackageCategory) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.isActive,
      sortOrder: String(category.sortOrder),
    });
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const input = {
        name: form.name,
        slug: form.slug.trim() || undefined,
        description: form.description,
        isActive: form.isActive,
        sortOrder: form.sortOrder.trim() ? Number(form.sortOrder) : 0,
      };

      if (editingId) {
        await withAuthRefresh(
          () => updatePackageCategory(editingId, input),
          redirectToLogin,
        );
      } else {
        await withAuthRefresh(
          () => createPackageCategory(input),
          redirectToLogin,
        );
      }

      resetForm();
      await loadCategories();
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, saveErrorMessage));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await withAuthRefresh(
        () => deletePackageCategory(deleteTarget.id),
        redirectToLogin,
      );
      setDeleteTarget(null);
      await loadCategories();
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, deleteErrorMessage));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="border-b border-zinc-200 pb-6">
        <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
          Danh mục gói chụp
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          Quản lý danh mục
        </h1>
      </header>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="self-start rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold">
            {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
          </h2>

          <label className="mt-5 block text-sm font-medium text-zinc-700">
            Tên
            <input
              value={form.name}
              onChange={(event) =>
                setForm((value) => ({ ...value, name: event.target.value }))
              }
              maxLength={120}
              required
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="mt-5 block text-sm font-medium text-zinc-700">
            Đường dẫn
            <input
              value={form.slug}
              onChange={(event) =>
                setForm((value) => ({ ...value, slug: event.target.value }))
              }
              placeholder="Để trống để hệ thống tự tạo từ tên"
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <p className="mt-2 text-xs text-zinc-500">
            Đường dẫn dùng trên website, ví dụ: goi-chup-cuoi.
          </p>

          <label className="mt-5 block text-sm font-medium text-zinc-700">
            Mô tả
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((value) => ({
                  ...value,
                  description: event.target.value,
                }))
              }
              rows={4}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="mt-5 block text-sm font-medium text-zinc-700">
            Thứ tự
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((value) => ({
                  ...value,
                  sortOrder: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="mt-5 flex items-center gap-3 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((value) => ({
                  ...value,
                  isActive: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
            />
            Hiển thị
          </label>

          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold transition hover:bg-zinc-50"
              >
                Hủy
              </button>
            ) : null}
          </div>
        </form>

        <div className="overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-zinc-600">Đang tải...</p>
          ) : null}

          {!isLoading && categories.length === 0 ? (
            <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
              Chưa có dữ liệu.
            </p>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-normal text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tên</th>
                  <th className="px-4 py-3 font-semibold">Đường dẫn</th>
                  <th className="px-4 py-3 font-semibold">Hiển thị</th>
                  <th className="px-4 py-3 font-semibold">Thứ tự</th>
                  <th className="px-4 py-3 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3 font-semibold">{category.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{category.slug}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {category.isActive ? "Đang hiển thị" : "Đã ẩn"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {category.sortOrder}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold transition hover:bg-zinc-50"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(category)}
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
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xóa danh mục gói chụp?"
        description={
          <>
            Bạn có chắc muốn xóa{" "}
            <span className="font-semibold text-zinc-900">
              {deleteTarget?.name}
            </span>
            ? Nếu danh mục đang được sử dụng, hệ thống sẽ không cho xóa.
          </>
        }
        isLoading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </section>
  );
}
