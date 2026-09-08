import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMediaAssetUrl } from "@/lib/api/client";
import {
  getLocationBySlug,
  type LocationOpeningHour,
  type LocationWeekday,
  type PublicLocationDetail,
} from "@/lib/api/locations";
import {
  formatOpeningHour,
  getOrderedOpeningHours,
  weekdayLabels,
} from "@/lib/location-format";

const LIST_TITLE = "\u0110\u1ecba \u0111i\u1ec3m";

interface LocationDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: LocationDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);

  if (!location) {
    return {
      title: "Location not found | Studio",
    };
  }

  const title = location.seo.title || location.name;
  const description =
    location.seo.description || location.description || location.address;
  const ogImage = location.seo.ogImage || location.cover;
  const galleryFallback = location.gallery[0];

  return {
    title: `${title} | Studio`,
    description,
    alternates: {
      canonical: getCanonicalPath(`/dia-diem/${location.slug}`),
    },
    openGraph: {
      title,
      description,
      images: createOpenGraphImages(location, ogImage, galleryFallback),
    },
  };
}

export default async function LocationDetailPage({
  params,
}: LocationDetailPageProps) {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);

  if (!location) {
    notFound();
  }

  const mapHref = getMapHref(location);
  const jsonLd = createLocalBusinessJsonLd(location);

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <article className="mx-auto w-full max-w-6xl px-6 py-10">
        <nav className="text-sm text-zinc-500">
          <Link href="/dia-diem" className="font-medium hover:text-zinc-900">
            {LIST_TITLE}
          </Link>
          <span className="px-2">/</span>
          <span>{location.name}</span>
        </nav>

        <header className="mt-6 grid gap-8 border-b border-zinc-200 pb-8 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
              Studio
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal">
              {location.name}
            </h1>
            <p className="mt-5 whitespace-pre-line text-base leading-7 text-zinc-600">
              {location.description || location.address}
            </p>
            <div className="mt-6 grid gap-3 text-sm text-zinc-700">
              <p>
                <span className="font-semibold">Address: </span>
                {location.address}
              </p>
              <p>
                <span className="font-semibold">Phone: </span>
                {location.phone}
              </p>
              {location.email ? (
                <p>
                  <span className="font-semibold">Email: </span>
                  {location.email}
                </p>
              ) : null}
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link
                href={`/dat-lich?location=${location.slug}`}
                className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                {"\u0110\u1eb7t l\u1ecbch"}
              </Link>
              {mapHref ? (
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-zinc-50"
                >
                  {"Xem b\u1ea3n \u0111\u1ed3"}
                </a>
              ) : null}
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100">
            {location.cover ? (
              <Image
                src={getMediaAssetUrl(location.cover.url)}
                alt={location.cover.alt || location.name}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                Studio
              </div>
            )}
          </div>
        </header>

        <div className="grid gap-8 border-b border-zinc-200 py-8 lg:grid-cols-[320px_1fr]">
          <section>
            <h2 className="text-lg font-semibold">Opening Hours</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {getOrderedOpeningHours(location.openingHours).map((item) => (
                <div
                  key={item.day}
                  className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2"
                >
                  <dt className="font-semibold text-zinc-700">
                    {weekdayLabels[item.day]}
                  </dt>
                  <dd className="text-zinc-600">{formatOpeningHour(item)}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Contact</h2>
            <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-5 text-sm leading-7 text-zinc-700">
              <p>{location.address}</p>
              <p>{location.phone}</p>
              {location.email ? <p>{location.email}</p> : null}
              {location.coordinates.latitude !== null &&
              location.coordinates.longitude !== null ? (
                <p>
                  {location.coordinates.latitude},{" "}
                  {location.coordinates.longitude}
                </p>
              ) : null}
            </div>
          </section>
        </div>

        {location.gallery.length > 0 ? (
          <section className="py-8">
            <h2 className="text-lg font-semibold">Gallery</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {location.gallery.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100"
                >
                  <Image
                    src={getMediaAssetUrl(image.medium.url)}
                    alt={image.alt || location.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}

function getMapHref(location: PublicLocationDetail): string | null {
  if (location.mapUrl) {
    return location.mapUrl;
  }

  if (
    location.coordinates.latitude !== null &&
    location.coordinates.longitude !== null
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${location.coordinates.latitude},${location.coordinates.longitude}`,
    )}`;
  }

  return null;
}

function createLocalBusinessJsonLd(location: PublicLocationDetail) {
  const canonical = getCanonicalPath(`/dia-diem/${location.slug}`);
  const image = location.seo.ogImage || location.cover;
  const galleryFallback = location.gallery[0];

  return removeEmpty({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: location.name,
    description: location.description || undefined,
    address: location.address || undefined,
    telephone: location.phone || undefined,
    email: location.email || undefined,
    url: canonical,
    image: image
      ? getMediaAssetUrl(image.url)
      : galleryFallback
        ? getMediaAssetUrl(galleryFallback.large.url)
        : undefined,
    geo:
      location.coordinates.latitude !== null &&
      location.coordinates.longitude !== null
        ? {
            "@type": "GeoCoordinates",
            latitude: location.coordinates.latitude,
            longitude: location.coordinates.longitude,
          }
        : undefined,
    openingHoursSpecification: createOpeningHoursSpecification(
      location.openingHours,
    ),
  });
}

function createOpenGraphImages(
  location: PublicLocationDetail,
  image: PublicLocationDetail["cover"],
  galleryFallback: PublicLocationDetail["gallery"][number] | undefined,
) {
  if (image) {
    return [
      {
        url: getMediaAssetUrl(image.url),
        width: image.width,
        height: image.height,
        alt: image.alt || location.name,
      },
    ];
  }

  if (!galleryFallback) {
    return undefined;
  }

  return [
    {
      url: getMediaAssetUrl(galleryFallback.large.url),
      width: galleryFallback.large.width,
      height: galleryFallback.large.height,
      alt: galleryFallback.alt || location.name,
    },
  ];
}

function createOpeningHoursSpecification(openingHours: LocationOpeningHour[]) {
  const specifications = openingHours
    .filter((item) => !item.isClosed && item.openTime && item.closeTime)
    .map((item) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: toSchemaDay(item.day),
      opens: item.openTime,
      closes: item.closeTime,
    }));

  return specifications.length > 0 ? specifications : undefined;
}

function toSchemaDay(day: LocationWeekday): string {
  return `https://schema.org/${day.charAt(0).toUpperCase()}${day.slice(1)}`;
}

function removeEmpty<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as T;
}

function getCanonicalPath(path: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl).toString();
}
