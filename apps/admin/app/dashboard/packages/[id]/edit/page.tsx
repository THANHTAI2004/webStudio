"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PackageForm } from "@/components/packages/package-form";
import {
  type PackageCategory,
  getPackageCategories,
} from "@/lib/api/package-categories";
import { type AdminPackage, getPackageById } from "@/lib/api/packages";
import { getAdminErrorMessage, loadErrorMessage } from "@/lib/admin-labels";
import { withAuthRefresh } from "@/lib/api/session";

export default function EditPackagePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [packageItem, setPackageItem] = useState<AdminPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      async function loadForm() {
        setIsLoading(true);
        setError(null);

        try {
          const [packageResponse, categoryResponse] = await Promise.all([
            withAuthRefresh(() => getPackageById(params.id), redirectToLogin),
            withAuthRefresh(getPackageCategories, redirectToLogin),
          ]);

          if (!packageResponse || !categoryResponse) {
            return;
          }

          setPackageItem(packageResponse.data);
          setCategories(categoryResponse.data);
        } catch (caughtError) {
          setError(getAdminErrorMessage(caughtError, loadErrorMessage));
        } finally {
          setIsLoading(false);
        }
      }

      void loadForm();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [params.id, redirectToLogin]);

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="border-b border-zinc-200 pb-6">
        <Link
          href="/dashboard/packages"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          Gói chụp
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          Chỉnh sửa gói chụp
        </h1>
      </header>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-sm text-zinc-600">Đang tải...</p>
      ) : null}

      {!isLoading && packageItem && categories.length > 0 ? (
        <div className="mt-8">
          <PackageForm categories={categories} initialPackage={packageItem} />
        </div>
      ) : null}
    </section>
  );
}
