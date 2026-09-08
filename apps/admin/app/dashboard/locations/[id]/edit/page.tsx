"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LocationForm } from "@/components/locations/location-form";
import {
  type AdminLocation,
  getLocationById,
} from "@/lib/api/locations";
import { getAdminErrorMessage, loadErrorMessage } from "@/lib/admin-labels";
import { withAuthRefresh } from "@/lib/api/session";

export default function EditLocationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [location, setLocation] = useState<AdminLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      async function loadLocation() {
        setIsLoading(true);
        setError(null);

        try {
          const response = await withAuthRefresh(
            () => getLocationById(params.id),
            redirectToLogin,
          );

          if (response) {
            setLocation(response.data);
          }
        } catch (caughtError) {
          setError(getAdminErrorMessage(caughtError, loadErrorMessage));
        } finally {
          setIsLoading(false);
        }
      }

      void loadLocation();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [params.id, redirectToLogin]);

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="border-b border-zinc-200 pb-6">
        <Link
          href="/dashboard/locations"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          Cơ sở
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          Chỉnh sửa cơ sở
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

      {!isLoading && location ? (
        <div className="mt-8">
          <LocationForm initialLocation={location} />
        </div>
      ) : null}
    </section>
  );
}
