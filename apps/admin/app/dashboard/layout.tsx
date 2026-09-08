"use client";

import {
  CalendarDays,
  Camera,
  ExternalLink,
  FileText,
  Home,
  Image as ImageIcon,
  Images,
  Info,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Palette,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type AdminProfile, getMe, logout } from "@/lib/api/auth";
import { withAuthRefresh } from "@/lib/api/session";
import { getPublicUrl } from "@/lib/site-url";

interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    title: "Tổng quan",
    items: [{ href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard }],
  },
  {
    title: "Nội dung website",
    items: [
      { href: "/dashboard/home", label: "Trang chủ", icon: Home },
      { href: "/dashboard/about", label: "Giới thiệu", icon: Info },
      { href: "/dashboard/packages", label: "Gói chụp", icon: Camera },
      { href: "/dashboard/albums", label: "Album ảnh", icon: Images },
      { href: "/dashboard/posts", label: "Bài viết", icon: FileText },
      { href: "/dashboard/locations", label: "Cơ sở", icon: MapPin },
    ],
  },
  {
    title: "Khách hàng",
    items: [
      { href: "/dashboard/bookings", label: "Đặt lịch", icon: CalendarDays },
      { href: "/dashboard/contacts", label: "Liên hệ", icon: MessageSquare },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { href: "/dashboard/media", label: "Thư viện ảnh", icon: ImageIcon },
      { href: "/dashboard/theme", label: "Giao diện", icon: Palette },
      { href: "/dashboard/settings", label: "Cài đặt", icon: Settings },
    ],
  },
];

const hiddenRouteLabels: Record<string, string> = {
  "/dashboard/package-categories": "Danh mục gói chụp",
  "/dashboard/album-categories": "Danh mục album",
  "/dashboard/post-categories": "Danh mục bài viết",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const publicHomeUrl = useMemo(() => getPublicUrl("/"), []);
  const pageLabel = getPageLabel(pathname);

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

  useEffect(() => {
    if (!isMobileNavOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileNavOpen]);

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
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 text-zinc-950">
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5 shadow-sm">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-700" />
          <p className="mt-4 text-sm font-semibold text-zinc-600">
            Đang tải trang quản trị...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden h-screen flex-col border-r border-zinc-200 bg-white lg:sticky lg:top-0 lg:flex">
        <SidebarContent
          admin={admin}
          pathname={pathname}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
        />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="inline-flex size-10 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 lg:hidden"
                aria-label="Mở menu quản trị"
              >
                <Menu size={18} aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
                  Trang quản trị
                </p>
                <p className="truncate text-sm font-bold text-zinc-950">
                  {pageLabel}
                </p>
              </div>
            </div>

            <a
              href={publicHomeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              <ExternalLink size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Xem website</span>
            </a>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/35"
            aria-label="Đóng menu quản trị"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <aside className="relative flex h-full w-[min(320px,88vw)] flex-col bg-white shadow-xl">
            <div className="flex justify-end px-4 pt-4">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700"
                aria-label="Đóng menu quản trị"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <SidebarContent
              admin={admin}
              pathname={pathname}
              isLoggingOut={isLoggingOut}
              onLogout={handleLogout}
              onNavigate={() => setIsMobileNavOpen(false)}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function SidebarContent({
  admin,
  pathname,
  isLoggingOut,
  onLogout,
  onNavigate,
}: {
  admin: AdminProfile | null;
  pathname: string;
  isLoggingOut: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="border-b border-zinc-200 px-6 py-6">
        <p className="text-sm font-extrabold uppercase tracking-normal text-emerald-700">
          Quản trị Studio
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          Quản lý nội dung, lịch hẹn và thư viện ảnh.
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Menu quản trị">
        <div className="grid gap-6">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <p className="px-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-zinc-400">
                {group.title}
              </p>
              <div className="mt-2 grid gap-1">
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-zinc-200 p-4">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {admin?.email ?? "Quản trị viên"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Phiên đăng nhập hiện tại</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
        >
          <LogOut size={16} aria-hidden="true" />
          {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </div>
    </>
  );
}

function SidebarLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavigationItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
        isActive
          ? "bg-zinc-950 text-white shadow-sm"
          : "text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

function getPageLabel(pathname: string): string {
  const hiddenRouteLabel = Object.entries(hiddenRouteLabels).find(([href]) =>
    pathname.startsWith(href),
  )?.[1];

  if (hiddenRouteLabel) {
    return hiddenRouteLabel;
  }

  const items = navigationGroups.flatMap((group) => group.items);
  const activeItem = items
    .filter(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href)),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  return activeItem?.label ?? "Trang quản trị";
}
