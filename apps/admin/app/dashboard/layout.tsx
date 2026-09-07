"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { type AdminProfile, getMe, logout } from "@/lib/api/auth";
import { withAuthRefresh } from "@/lib/api/session";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/media", label: "Media" },
  { href: "/dashboard/posts", label: "Tin t\u1ee9c" },
  { href: "/dashboard/post-categories", label: "Danh m\u1ee5c tin" },
  { href: "/dashboard/albums", label: "Album" },
  { href: "/dashboard/album-categories", label: "Danh m\u1ee5c Album" },
  { href: "/dashboard/packages", label: "G\u00f3i ch\u1ee5p" },
  { href: "/dashboard/package-categories", label: "Danh m\u1ee5c g\u00f3i" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      async function loadAdmin() {
        const response = await withAuthRefresh(getMe, redirectToLogin);

        if (response) {
          setAdmin(response.data);
        }

        setIsCheckingAuth(false);
      }

      void loadAdmin();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [redirectToLogin]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-zinc-950">
        <p className="text-sm text-zinc-600">Loading admin...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-zinc-200 bg-white px-6 py-5 lg:border-b-0 lg:border-r">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Studio Admin
          </p>
          <p className="mt-2 break-all text-sm text-zinc-600">{admin?.email}</p>
        </div>

        <nav className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-6 w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </aside>

      <main className="px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
