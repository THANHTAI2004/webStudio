import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmptyState, PageHero } from "@/components/ui/public-ui";
import { getMediaAssetUrl } from "@/lib/api/client";
import { getLocations, type PublicLocationListItem } from "@/lib/api/locations";
import { getOpeningStatus } from "@/lib/location-format";

const TITLE = "Cơ sở";
const INTRO =
  "Khám phá các cơ sở Studio đang hoạt động và chọn không gian phù hợp cho buổi chụp của bạn.";

export const metadata: Metadata = {
  title: `${TITLE} | Studio`,
  description: "Danh sách các cơ sở Studio đang hoạt động.",
  alternates: {
    canonical: getCanonicalPath("/dia-diem"),
  },
};

export default async function LocationsPage() {
  const locations = await getLocations({ cache: "no-store" });

  return (
    <main>
      <PageHero eyebrow="Không gian" title={TITLE} description={INTRO} />

      <section className="public-section">
        <div className="site-container">
          {locations.length === 0 ? (
            <EmptyState
              title="Chưa có cơ sở đang hiển thị."
              description="Studio sẽ cập nhật địa chỉ và thông tin liên hệ tại đây khi sẵn sàng."
              actionHref="/lien-he"
              actionLabel="Liên hệ Studio"
            />
          ) : null}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {locations.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function LocationCard({ location }: { location: PublicLocationListItem }) {
  const openingStatus = getOpeningStatus(location.openingHours);

  return (
    <article className="public-card">
      <Link
        href={`/dia-diem/${location.slug}`}
        className="image-link aspect-[4/3]"
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
          <span className="media-fallback">Cơ sở</span>
        )}
      </Link>
      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2
            className="text-2xl font-semibold leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <Link href={`/dia-diem/${location.slug}`}>{location.name}</Link>
          </h2>
          {location.featured ? (
            <span className="rounded-full border border-[var(--color-accent)] px-3 py-1 text-xs font-extrabold text-[var(--color-accent)]">
              Nổi bật
            </span>
          ) : null}
        </div>
        <p className="mt-4 line-clamp-2 text-sm leading-7 text-[var(--color-muted)]">
          {location.address}
        </p>
        {location.phone ? (
          <a
            href={`tel:${location.phone}`}
            className="mt-4 inline-flex text-sm font-extrabold text-[var(--color-primary)]"
          >
            {location.phone}
          </a>
        ) : null}
        <p
          className={`mt-4 text-sm font-semibold ${
            openingStatus.isOpen
              ? "text-emerald-700"
              : "text-[var(--color-muted)]"
          }`}
        >
          {openingStatus.text}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/dia-diem/${location.slug}`} className="theme-button-secondary">
            Xem cơ sở
          </Link>
          <Link
            href={`/dat-lich?location=${location.slug}`}
            className="theme-button-primary"
          >
            Đặt lịch
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
