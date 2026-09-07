"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PackageForm } from "@/components/packages/package-form";
import {
  type PackageCategory,
  getPackageCategories,
} from "@/lib/api/package-categories";
import { withAuthRefresh } from "@/lib/api/session";

export default function NewPackagePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      async function loadCategories() {
        setIsLoading(true);
        setError(null);

        try {
          const response = await withAuthRefresh(
            getPackageCategories,
            redirectToLogin,
          );

          if (response) {
            setCategories(response.data);
          }
        } catch (caughtError) {
          setError(getErrorMessage(caughtError, "Unable to load categories."));
        } finally {
          setIsLoading(false);
        }
      }

      void loadCategories();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [redirectToLogin]);

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="border-b border-zinc-200 pb-6">
        <Link
          href="/dashboard/packages"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          Packages
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          New Package
        </h1>
      </header>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-sm text-zinc-600">Loading form...</p>
      ) : null}

      {!isLoading && categories.length === 0 ? (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Create a package category before adding packages.
          </p>
          <Link
            href="/dashboard/package-categories"
            className="mt-4 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Go to Categories
          </Link>
        </div>
      ) : null}

      {!isLoading && categories.length > 0 ? (
        <div className="mt-8">
          <PackageForm categories={categories} />
        </div>
      ) : null}
    </section>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
