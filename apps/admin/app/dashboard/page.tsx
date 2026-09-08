import {
  CalendarDays,
  Camera,
  FileText,
  Home,
  Image as ImageIcon,
  Images,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface Shortcut {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "emerald" | "sky" | "amber" | "zinc";
}

const primaryShortcuts: Shortcut[] = [
  {
    href: "/dashboard/bookings",
    title: "Đặt lịch",
    description: "Xem và xử lý yêu cầu đặt lịch chụp mới.",
    icon: CalendarDays,
    tone: "emerald",
  },
  {
    href: "/dashboard/contacts",
    title: "Liên hệ",
    description: "Theo dõi tin nhắn và phản hồi khách hàng.",
    icon: MessageSquare,
    tone: "sky",
  },
  {
    href: "/dashboard/media",
    title: "Thư viện ảnh",
    description: "Tải lên, tìm kiếm và quản lý ảnh dùng trên website.",
    icon: ImageIcon,
    tone: "amber",
  },
];

const contentShortcuts: Shortcut[] = [
  {
    href: "/dashboard/packages",
    title: "Gói chụp",
    description: "Tạo và cập nhật các gói dịch vụ chụp ảnh.",
    icon: Camera,
    tone: "zinc",
  },
  {
    href: "/dashboard/albums",
    title: "Album ảnh",
    description: "Quản lý portfolio và các bộ ảnh nổi bật.",
    icon: Images,
    tone: "zinc",
  },
  {
    href: "/dashboard/posts",
    title: "Bài viết",
    description: "Viết, chỉnh sửa và xuất bản bài viết.",
    icon: FileText,
    tone: "zinc",
  },
  {
    href: "/dashboard/home",
    title: "Trang chủ",
    description: "Chỉnh nội dung hiển thị ở trang chủ website.",
    icon: Home,
    tone: "zinc",
  },
  {
    href: "/dashboard/settings",
    title: "Cài đặt",
    description: "Cập nhật thương hiệu, liên hệ, menu và SEO mặc định.",
    icon: Settings,
    tone: "zinc",
  },
];

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-7xl">
      <header className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
          Tổng quan
        </p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Trung tâm quản trị Studio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Quản lý lịch hẹn, tin nhắn, nội dung website và thư viện ảnh trong
              một giao diện gọn, rõ và dễ thao tác.
            </p>
          </div>
          <Link
            href="/dashboard/bookings"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Xem lịch đặt chụp
          </Link>
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {primaryShortcuts.map((item) => (
          <ShortcutCard key={item.href} item={item} featured />
        ))}
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-zinc-500">
              Công việc thường dùng
            </p>
            <h2 className="mt-2 text-xl font-semibold">Nội dung và hệ thống</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contentShortcuts.map((item) => (
            <ShortcutCard key={item.href} item={item} />
          ))}
        </div>
      </section>
    </section>
  );
}

function ShortcutCard({
  item,
  featured = false,
}: {
  item: Shortcut;
  featured?: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`group rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md ${
        featured ? "min-h-44" : ""
      }`}
    >
      <span
        className={`inline-flex size-10 items-center justify-center rounded-md ${getToneClass(
          item.tone,
        )}`}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-base font-semibold text-zinc-950 group-hover:text-emerald-800">
        {item.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
    </Link>
  );
}

function getToneClass(tone: Shortcut["tone"]): string {
  switch (tone) {
    case "emerald":
      return "bg-emerald-50 text-emerald-700";
    case "sky":
      return "bg-sky-50 text-sky-700";
    case "amber":
      return "bg-amber-50 text-amber-800";
    case "zinc":
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}
