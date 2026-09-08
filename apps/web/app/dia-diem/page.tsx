import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getMediaAssetUrl } from "@/lib/api/client";
import { getLocations, type PublicLocationListItem } from "@/lib/api/locations";
import {
  getOpeningStatus,
} from "@/lib/location-format";

const TITLE = "\u0110\u1ecba \u0111i\u1ec3m";
const INTRO =
  "Kh\u00e1m ph\u00e1 c\u00e1c c\u01a1 s\u1edf Studio \u0111ang ho\u1ea1t \u0111\u1ed9ng v\u00e0 ch\u1ecdn \u0111\u1ecba \u0111i\u1ec3m ph\u00f9 h\u1ee3p cho bu\u1ed5i ch\u1ee5p c\u1ee7a b\u1ea1n.";

export const metadata: Metadata = {
  title: `${TITLE} | Studio`,
  description:
    "Danh s\u00e1ch c\u00e1c c\u01a1 s\u1edf Studio \u0111ang ho\u1ea1t \u0111\u1ed9ng.",
  alternates: {
    canonical: getCanonicalPath("/dia-diem"),
  },
};

export default async function LocationsPage() {
  const locations = await getLocations({ cache: "no-store" });

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="border-b border-zinc-200 pb-7">
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Studio
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal">
            {TITLE}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
            {INTRO}
          </p>
        </header>

        {locations.length === 0 ? (
          <p className="mt-10 rounded-lg border border-zinc-200 bg-white px-5 py-8 text-sm text-zinc-600">
            {"Ch\u01b0a c\u00f3 c\u01a1 s\u1edf \u0111ang hi\u1ec3n th\u1ecb."}
          </p>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      </section>
    </main>
  );
}

function LocationCard({ location }: { location: PublicLocationListItem }) {
  const openingStatus = getOpeningStatus(location.openingHours);

  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <Link
        href={`/dia-diem/${location.slug}`}
        className="relative block aspect-[4/3] bg-zinc-100"
      >
        {location.cover ? (
          <Image
            src={getMediaAssetUrl(location.cover.url)}
            alt={location.cover.alt || location.name}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-zinc-500">
            Studio
          </span>
        )}
      </Link>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            <Link href={`/dia-diem/${location.slug}`}>{location.name}</Link>
          </h2>
          {location.featured ? (
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
              Featured
            </span>
          ) : null}
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">
          {location.address}
        </p>
        <p className="mt-3 text-sm font-semibold text-zinc-800">
          {location.phone}
        </p>
        <p
          className={`mt-3 text-sm font-medium ${
            openingStatus.isOpen ? "text-emerald-700" : "text-zinc-500"
          }`}
        >
          {openingStatus.text}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/dia-diem/${location.slug}`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold transition hover:bg-zinc-50"
          >
            {"Xem c\u01a1 s\u1edf"}
          </Link>
          <Link
            href={`/dat-lich?location=${location.slug}`}
            className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            {"\u0110\u1eb7t l\u1ecbch"}
          </Link>
        </div>
      </div>
    </article>
  );
}

function getCanonicalPath(path: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl).toString();
}
