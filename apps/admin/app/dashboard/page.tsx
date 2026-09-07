import Link from "next/link";

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-normal">
          Studio Admin Dashboard
        </h1>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/media"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <h2 className="text-base font-semibold">Media Library</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Upload and manage images.
          </p>
        </Link>
        <Link
          href="/dashboard/albums"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <h2 className="text-base font-semibold">Album</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Create and publish photo galleries.
          </p>
        </Link>
        <Link
          href="/dashboard/album-categories"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <h2 className="text-base font-semibold">Danh muc Album</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Organize albums by category.
          </p>
        </Link>
        <Link
          href="/dashboard/packages"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <h2 className="text-base font-semibold">Goi chup</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Create and publish package pages.
          </p>
        </Link>
        <Link
          href="/dashboard/package-categories"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <h2 className="text-base font-semibold">Danh muc goi</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Organize packages by category.
          </p>
        </Link>
      </div>
    </section>
  );
}
