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
          href="/dashboard/bookings"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <h2 className="text-base font-semibold">
            {"\u0110\u1eb7t l\u1ecbch"}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Manage booking requests and workflow.
          </p>
        </Link>
        <Link
          href="/dashboard/locations"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <h2 className="text-base font-semibold">
            {"\u0110\u1ecba \u0111i\u1ec3m"}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Manage studio branches, hours, media, and SEO.
          </p>
        </Link>
        <Link
          href="/dashboard/contacts"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <h2 className="text-base font-semibold">{"Li\u00ean h\u1ec7"}</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Review customer messages and follow-up status.
          </p>
        </Link>
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
          href="/dashboard/posts"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <h2 className="text-base font-semibold">{"Tin t\u1ee9c"}</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Create and publish news articles.
          </p>
        </Link>
        <Link
          href="/dashboard/post-categories"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <h2 className="text-base font-semibold">{"Danh m\u1ee5c tin"}</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Organize news articles by category.
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
          <h2 className="text-base font-semibold">{"Danh m\u1ee5c Album"}</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Organize albums by category.
          </p>
        </Link>
        <Link
          href="/dashboard/packages"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <h2 className="text-base font-semibold">{"G\u00f3i ch\u1ee5p"}</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Create and publish package pages.
          </p>
        </Link>
        <Link
          href="/dashboard/package-categories"
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <h2 className="text-base font-semibold">{"Danh m\u1ee5c g\u00f3i"}</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Organize packages by category.
          </p>
        </Link>
      </div>
    </section>
  );
}
