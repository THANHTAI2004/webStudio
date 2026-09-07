"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { AdminProfile, getMe, logout, refresh } from "@/lib/api/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAdmin() {
      try {
        const response = await getMe();

        if (isMounted) {
          setAdmin(response.data);
        }
      } catch (caughtError) {
        if (caughtError instanceof ApiError && caughtError.status === 401) {
          try {
            await refresh();
            const retryResponse = await getMe();

            if (isMounted) {
              setAdmin(retryResponse.data);
            }
          } catch {
            router.replace("/login");
          }
        } else if (isMounted) {
          setError("Unable to load admin profile.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAdmin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-8 text-zinc-950">
      <section className="mx-auto w-full max-w-5xl">
        <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
              Studio Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Studio Admin Dashboard
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400 sm:w-auto"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </header>

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <p className="text-sm text-zinc-600">Loading profile...</p>
          ) : null}

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          {admin ? (
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-zinc-500">Name</dt>
                <dd className="mt-1 text-base font-semibold">{admin.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-500">Email</dt>
                <dd className="mt-1 break-all text-base font-semibold">
                  {admin.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-500">Role</dt>
                <dd className="mt-1 text-base font-semibold">{admin.role}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      </section>
    </main>
  );
}
