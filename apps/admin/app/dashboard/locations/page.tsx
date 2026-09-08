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
import { withAuthRefresh } from "@/lib/api/session";

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
      setError(getErrorMessage(caughtError, "Unable to load locations."));
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

  async function handleDelete(location: AdminLocation) {
    const confirmed = window.confirm(`Delete location "${location.name}"?`);

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await withAuthRefresh(
        () => deleteLocation(location.id),
        redirectToLogin,
      );
      await loadData();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to delete location."));
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Locations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Location Management
          </h1>
        </div>
        <Link
          href="/dashboard/locations/new"
          className="rounded-md bg-zinc-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          New Location
        </Link>
      </header>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_160px_160px_190px]">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Search name, address, phone"
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
          <option value="">All active</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          value={String(featured)}
          onChange={(event) => {
            setPage(1);
            setFeatured(toOptionalBoolean(event.target.value));
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">All featured</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </select>
        <select
          value={sort}
          onChange={(event) => {
            setPage(1);
            setSort(event.target.value);
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="sortOrder:asc">Sort order</option>
          <option value="createdAt:desc">Newest</option>
          <option value="name:asc">Name A-Z</option>
        </select>
      </div>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-sm text-zinc-600">Loading locations...</p>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-normal text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Cover</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Address</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Active</th>
              <th className="px-4 py-3 font-semibold">Featured</th>
              <th className="px-4 py-3 font-semibold">Sort</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {!isLoading && locations.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  No locations found.
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
                      Empty
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
                  {location.isActive ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {location.isFeatured ? "Yes" : "No"}
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
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(location)}
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

function toOptionalBoolean(value: string): boolean | "" {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return "";
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
