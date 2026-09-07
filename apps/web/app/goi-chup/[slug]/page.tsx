import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMediaAssetUrl } from "@/lib/api/client";
import { getPackageBySlug, type PublicPackageDetail } from "@/lib/api/packages";

const LIST_TITLE = "G\u00f3i ch\u1ee5p";
const BOOKING_CTA = "\u0110\u1eb7t l\u1ecbch";
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

interface PackageDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PackageDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const packageItem = await getPackageBySlug(slug);

  if (!packageItem) {
    return {
      title: "Package not found | Studio Website",
    };
  }

  const title = packageItem.seo.title || packageItem.name;
  const description =
    packageItem.seo.description || packageItem.description || packageItem.name;
  const ogImage =
    packageItem.seo.ogImage || packageItem.thumbnail || packageItem.gallery[0];

  return {
    title: `${title} | Studio Website`,
    description,
    alternates: {
      canonical: getCanonicalPath(`/goi-chup/${packageItem.slug}`),
    },
    openGraph: {
      title,
      description,
      images: ogImage
        ? [
            {
              url: getMediaAssetUrl(ogImage.url),
              width: ogImage.width,
              height: ogImage.height,
              alt: ogImage.alt || packageItem.name,
            },
          ]
        : undefined,
    },
  };
}

export default async function PackageDetailPage({
  params,
}: PackageDetailPageProps) {
  const { slug } = await params;
  const packageItem = await getPackageBySlug(slug);

  if (!packageItem) {
    notFound();
  }

  const activePrice = packageItem.salePrice ?? packageItem.price;
  const jsonLd = createServiceJsonLd(packageItem);

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <article className="mx-auto w-full max-w-6xl px-6 py-10">
        <nav className="text-sm text-zinc-500">
          <Link href="/goi-chup" className="font-medium hover:text-zinc-900">
            {LIST_TITLE}
          </Link>
          <span className="px-2">/</span>
          <span>{packageItem.name}</span>
        </nav>

        <header className="mt-6 grid gap-8 border-b border-zinc-200 pb-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
              {packageItem.category?.name ?? "Studio"}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal">
              {packageItem.name}
            </h1>
            <p className="mt-5 whitespace-pre-line text-base leading-7 text-zinc-600">
              {packageItem.description}
            </p>
            <div className="mt-6 flex flex-wrap items-end gap-3">
              <p className="text-2xl font-semibold">
                {currencyFormatter.format(activePrice)}
              </p>
              {packageItem.salePrice !== null ? (
                <p className="text-base text-zinc-500 line-through">
                  {currencyFormatter.format(packageItem.price)}
                </p>
              ) : null}
              {packageItem.durationMinutes ? (
                <p className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700">
                  {packageItem.durationMinutes} min
                </p>
              ) : null}
            </div>
            <Link
              href={`/dat-lich?package=${packageItem.slug}`}
              className="mt-7 inline-flex rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              {BOOKING_CTA}
            </Link>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100">
            {packageItem.thumbnail ? (
              <Image
                src={getMediaAssetUrl(packageItem.thumbnail.url)}
                alt={packageItem.thumbnail.alt || packageItem.name}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                Studio Package
              </div>
            )}
          </div>
        </header>

        {packageItem.gallery.length > 0 ? (
          <section className="grid gap-4 border-b border-zinc-200 py-8 md:grid-cols-3">
            {packageItem.gallery.map((image) => (
              <div
                key={image.id}
                className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100"
              >
                <Image
                  src={getMediaAssetUrl(image.url)}
                  alt={image.alt || packageItem.name}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </section>
        ) : null}

        <div className="grid gap-8 py-8 lg:grid-cols-[320px_1fr]">
          <aside>
            <h2 className="text-lg font-semibold">Features</h2>
            {packageItem.features.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700">
                {packageItem.features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-md border border-zinc-200 bg-white px-3 py-2"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-zinc-600">
                Contact Studio for package details.
              </p>
            )}
          </aside>

          <section>
            <h2 className="text-lg font-semibold">Details</h2>
            <p className="mt-4 whitespace-pre-line text-base leading-8 text-zinc-700">
              {packageItem.content || packageItem.description}
            </p>
            <Link
              href={`/dat-lich?package=${packageItem.slug}`}
              className="mt-8 inline-flex rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              {BOOKING_CTA}
            </Link>
          </section>
        </div>
      </article>
    </main>
  );
}

function createServiceJsonLd(packageItem: PublicPackageDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: packageItem.name,
    description: packageItem.description,
    serviceType: packageItem.category?.name ?? "Photography",
    offers: {
      "@type": "Offer",
      price: packageItem.salePrice ?? packageItem.price,
      priceCurrency: "VND",
      url: getCanonicalPath(`/goi-chup/${packageItem.slug}`),
    },
    image: packageItem.thumbnail
      ? getMediaAssetUrl(packageItem.thumbnail.url)
      : undefined,
  };
}

function getCanonicalPath(path: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl).toString();
}
