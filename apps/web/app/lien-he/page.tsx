import type { Metadata } from "next";
import Link from "next/link";
import { getLocations } from "@/lib/api/locations";
import { ContactForm } from "./contact-form";

const TITLE = "Li\u00ean h\u1ec7";

export const metadata: Metadata = {
  title: `${TITLE} | Studio`,
  description:
    "G\u1eedi th\u00f4ng tin li\u00ean h\u1ec7 cho Studio \u0111\u1ec3 \u0111\u01b0\u1ee3c t\u01b0 v\u1ea5n s\u1edbm nh\u1ea5t.",
  alternates: {
    canonical: getCanonicalPath("/lien-he"),
  },
};

export default async function ContactPage() {
  const locations = await getLocations({ cache: "no-store" });

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <header className="border-b border-zinc-200 pb-6 lg:border-b-0 lg:border-r lg:pr-8">
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Studio
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">
            {TITLE}
          </h1>
          <p className="mt-5 text-base leading-7 text-zinc-600">
            {
              "Chia s\u1ebb nhu c\u1ea7u c\u1ee7a b\u1ea1n, Studio s\u1ebd ph\u1ea3n h\u1ed3i v\u1edbi th\u00f4ng tin ph\u00f9 h\u1ee3p trong th\u1eddi gian s\u1edbm nh\u1ea5t."
            }
          </p>

          <div className="mt-8 space-y-4">
            {locations.length === 0 ? (
              <p className="rounded-md border border-zinc-200 bg-white px-3 py-4 text-sm text-zinc-600">
                {"Ch\u01b0a c\u00f3 c\u01a1 s\u1edf \u0111ang hi\u1ec3n th\u1ecb."}
              </p>
            ) : null}

            {locations.map((location) => (
              <article
                key={location.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm"
              >
                <h2 className="font-semibold">{location.name}</h2>
                <p className="mt-2 leading-6 text-zinc-600">
                  {location.address}
                </p>
                <p className="mt-2 font-semibold text-zinc-800">
                  {location.phone}
                </p>
                {location.email ? (
                  <p className="mt-1 text-zinc-600">{location.email}</p>
                ) : null}
                <Link
                  href={`/dia-diem/${location.slug}`}
                  className="mt-3 inline-flex rounded-md border border-zinc-300 px-3 py-2 text-xs font-semibold transition hover:bg-zinc-50"
                >
                  {"Xem c\u01a1 s\u1edf"}
                </Link>
              </article>
            ))}
          </div>
        </header>

        <ContactForm locations={locations} />
      </section>
    </main>
  );
}

function getCanonicalPath(path: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl).toString();
}
