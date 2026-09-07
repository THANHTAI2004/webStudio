import type { Metadata } from "next";
import { getPackages } from "@/lib/api/packages";
import { BookingForm } from "./booking-form";

export const metadata: Metadata = {
  title: "\u0110\u1eb7t l\u1ecbch | Studio",
  description:
    "G\u1eedi y\u00eau c\u1ea7u \u0111\u1eb7t l\u1ecbch ch\u1ee5p \u1ea3nh v\u1edbi Studio.",
};

interface BookingPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const packageSlug = getFirstParam(resolvedSearchParams.package);
  const packageResponse = await getPackages({
    page: 1,
    limit: 100,
  }, {
    cache: "no-store",
  });

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <header className="border-b border-zinc-200 pb-6 lg:border-b-0 lg:border-r lg:pr-8">
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Studio
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">
            \u0110\u1eb7t l\u1ecbch ch\u1ee5p
          </h1>
          <p className="mt-5 text-base leading-7 text-zinc-600">
            Ch\u1ecdn g\u00f3i ch\u1ee5p, th\u1eddi gian mong mu\u1ed1n v\u00e0
            \u0111\u1ec3 l\u1ea1i th\u00f4ng tin li\u00ean h\u1ec7. Studio
            s\u1ebd ph\u1ea3n h\u1ed3i \u0111\u1ec3 x\u00e1c nh\u1eadn
            l\u1ecbch.
          </p>
        </header>

        <BookingForm
          packages={packageResponse?.data ?? []}
          preselectedPackageSlug={packageSlug}
        />
      </section>
    </main>
  );
}

function getFirstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
