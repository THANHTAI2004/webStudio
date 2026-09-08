import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicButtonLink, SectionHeader } from "@/components/ui/public-ui";
import { getMediaAssetUrl } from "@/lib/api/client";
import {
  getLocationBySlug,
  type LocationOpeningHour,
  type LocationWeekday,
  type PublicLocationDetail,
} from "@/lib/api/locations";
import {
  formatOpeningHour,
  getOpeningStatus,
  getOrderedOpeningHours,
  weekdayLabels,
} from "@/lib/location-format";

const LIST_TITLE = "Cơ sở";

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
      title: "Không tìm thấy cơ sở | Studio",
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
  const openingStatus = getOpeningStatus(location.openingHours);
  const jsonLd = createLocalBusinessJsonLd(location);

  return (
    <main>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <article>
        <section className="public-section">
          <div className="site-container">
            <nav className="public-breadcrumb" aria-label="Đường dẫn">
              <Link href="/dia-diem">{LIST_TITLE}</Link>
              <span>/</span>
              <span>{location.name}</span>
            </nav>

            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <header>
                <p className="section-eyebrow">Cơ sở Studio</p>
                <h1 className="display-heading">{location.name}</h1>
                <p className="page-hero__lead">
                  {location.description || location.address}
                </p>
                <p
                  className={`mt-5 text-sm font-extrabold ${
                    openingStatus.isOpen
                      ? "text-emerald-700"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  {openingStatus.text}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <PublicButtonLink
                    href={`/dat-lich?location=${location.slug}`}
                  >
                    Đặt lịch tại cơ sở này
                  </PublicButtonLink>
                  {mapHref ? (
                    <a
                      href={mapHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="theme-button-secondary"
                    >
                      Xem bản đồ
                    </a>
                  ) : null}
                </div>
              </header>

              <div className="image-frame aspect-[4/3]">
                {location.cover ? (
                  <Image
                    src={getMediaAssetUrl(location.cover.url)}
                    alt={location.cover.alt || location.name}
                    fill
                    priority
                    sizes="(min-width: 1024px) 54vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="media-fallback">Cơ sở</div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="public-section public-section--surface">
          <div className="site-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <SectionHeader eyebrow="Liên hệ" title="Thông tin cơ sở" />
              <div className="mt-8 grid gap-4 text-sm leading-7 text-[var(--color-text)]">
                <p className="theme-card p-4">
                  <span className="block font-extrabold">Địa chỉ</span>
                  <span className="text-[var(--color-muted)]">
                    {location.address}
                  </span>
                </p>
                {location.phone ? (
                  <p className="theme-card p-4">
                    <span className="block font-extrabold">Số điện thoại</span>
                    <a
                      href={`tel:${location.phone}`}
                      className="text-[var(--color-muted)]"
                    >
                      {location.phone}
                    </a>
                  </p>
                ) : null}
                {location.email ? (
                  <p className="theme-card p-4">
                    <span className="block font-extrabold">Email</span>
                    <a
                      href={`mailto:${location.email}`}
                      className="text-[var(--color-muted)]"
                    >
                      {location.email}
                    </a>
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <SectionHeader eyebrow="Thời gian" title="Giờ mở cửa" />
              <dl className="mt-8 grid gap-3 text-sm">
                {getOrderedOpeningHours(location.openingHours).map((item) => (
                  <div
                    key={item.day}
                    className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] py-3"
                  >
                    <dt className="font-extrabold text-[var(--color-text)]">
                      {weekdayLabels[item.day]}
                    </dt>
                    <dd className="text-[var(--color-muted)]">
                      {formatOpeningHour(item)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {location.gallery.length > 0 ? (
          <section className="public-section">
            <div className="site-container">
              <SectionHeader eyebrow="Không gian" title="Hình ảnh cơ sở" />
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {location.gallery.map((image) => (
                  <div key={image.id} className="image-frame aspect-[4/3]">
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
