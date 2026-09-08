import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  HomeAlbumCardView,
  HomeLocationCardView,
  HomePackageCardView,
  HomePostCardView,
} from "@/components/content/home-cards";
import { SectionHeader, SmartLink } from "@/components/ui/public-ui";
import { getMediaAssetUrl } from "@/lib/api/client";
import {
  type HomeSectionKey,
  type PublicHome,
  getPublicHome,
} from "@/lib/api/home";
import { getPublicSettings, type PublicSettings } from "@/lib/api/settings";
import { getCanonicalUrl, getSiteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, home] = await Promise.all([
    getPublicSettings({ cache: "no-store" }),
    getPublicHome({ cache: "no-store" }),
  ]);
  const title =
    home.seo.title || settings.defaultSeo.title || settings.studioName;
  const description =
    home.seo.description ||
    settings.defaultSeo.description ||
    home.hero.subtitle ||
    settings.tagline ||
    "Dịch vụ chụp ảnh chuyên nghiệp cho những khoảnh khắc đáng nhớ.";
  const ogImage =
    home.seo.ogImage ?? settings.defaultSeo.ogImage ?? home.hero.background;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl("/"),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl("/"),
      siteName: settings.studioName,
      images: ogImage
        ? [
            {
              url: getMediaAssetUrl(ogImage.url),
              width: ogImage.width,
              height: ogImage.height,
              alt: ogImage.alt || title,
            },
          ]
        : undefined,
    },
  };
}

export default async function HomePage() {
  const [settings, home] = await Promise.all([
    getPublicSettings({ cache: "no-store" }),
    getPublicHome({ cache: "no-store" }),
  ]);
  const sections = home.sectionOrder.map((sectionKey) =>
    renderHomeSection(sectionKey, home),
  );
  const hasSections = sections.some(Boolean);

  return (
    <main>
      <OrganizationJsonLd settings={settings} />
      {hasSections ? sections : <HeroSection home={home} />}
    </main>
  );
}

function renderHomeSection(sectionKey: HomeSectionKey, home: PublicHome) {
  switch (sectionKey) {
    case "hero":
      return home.hero.enabled ? <HeroSection key={sectionKey} home={home} /> : null;
    case "aboutPreview":
      return home.aboutPreview.enabled ? (
        <AboutPreviewSection key={sectionKey} home={home} />
      ) : null;
    case "featuredPackages":
      return home.featuredPackages.enabled &&
        home.featuredPackages.packages.length > 0 ? (
        <FeaturedPackagesSection key={sectionKey} home={home} />
      ) : null;
    case "featuredAlbums":
      return home.featuredAlbums.enabled && home.featuredAlbums.albums.length > 0 ? (
        <FeaturedAlbumsSection key={sectionKey} home={home} />
      ) : null;
    case "usp":
      return home.usp.enabled && home.usp.items.length > 0 ? (
        <UspSection key={sectionKey} home={home} />
      ) : null;
    case "testimonials":
      return home.testimonials.enabled && home.testimonials.items.length > 0 ? (
        <TestimonialsSection key={sectionKey} home={home} />
      ) : null;
    case "latestPosts":
      return home.latestPosts.enabled && home.latestPosts.posts.length > 0 ? (
        <LatestPostsSection key={sectionKey} home={home} />
      ) : null;
    case "locations":
      return home.locations.enabled && home.locations.locations.length > 0 ? (
        <LocationsSection key={sectionKey} home={home} />
      ) : null;
    case "bookingCta":
      return home.bookingCta.enabled ? (
        <BookingCtaSection key={sectionKey} home={home} />
      ) : null;
    default:
      return null;
  }
}

function HeroSection({ home }: { home: PublicHome }) {
  const title = home.hero.title || "Studio";
  const subtitle =
    home.hero.subtitle ||
    "Ghi lại những khoảnh khắc tự nhiên, tinh tế và giàu cảm xúc.";

  return (
    <section className="relative isolate min-h-[76vh] overflow-hidden md:min-h-[86vh]">
      {home.hero.background ? (
        <Image
          src={getMediaAssetUrl(home.hero.background.url)}
          alt={home.hero.background.alt || title}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 76%, var(--color-accent)))",
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/24 to-black/8" />

      <div className="site-container relative z-10 flex min-h-[76vh] items-center py-24 md:min-h-[86vh]">
        <div className="max-w-4xl text-white">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/78">
            {home.hero.eyebrow || "Studio chụp ảnh"}
          </p>
          <h1
            className="mt-5 text-5xl font-semibold leading-[0.98] md:text-7xl lg:text-8xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/86 md:text-lg">
            {subtitle}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <SmartLink
              href={home.hero.primaryCta.href}
              className="theme-button-primary"
            >
              {home.hero.primaryCta.label || "Đặt lịch ngay"}
            </SmartLink>
            <SmartLink
              href={home.hero.secondaryCta.href || "/album"}
              className="theme-button-secondary"
            >
              {home.hero.secondaryCta.label || "Xem album"}
            </SmartLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutPreviewSection({ home }: { home: PublicHome }) {
  return (
    <PublicSection>
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="relative aspect-[4/5] overflow-hidden md:aspect-[5/4] lg:aspect-[4/5]">
          {home.aboutPreview.media ? (
            <Image
              src={getMediaAssetUrl(home.aboutPreview.media.url)}
              alt={home.aboutPreview.media.alt || home.aboutPreview.heading}
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="media-fallback">Studio</div>
          )}
        </div>
        <div className="lg:max-w-xl">
          <p className="section-eyebrow">Câu chuyện</p>
          <h2 className="section-title">
            {home.aboutPreview.heading || "Câu chuyện của Studio"}
          </h2>
          {home.aboutPreview.description ? (
            <p className="section-description">
              {home.aboutPreview.description}
            </p>
          ) : null}
          <Link href="/gioi-thieu" className="theme-button-primary mt-8">
            {home.aboutPreview.buttonLabel || "Tìm hiểu Studio"}
          </Link>
        </div>
      </div>
    </PublicSection>
  );
}

function FeaturedPackagesSection({ home }: { home: PublicHome }) {
  return (
    <PublicSection surface>
      <SectionHeader
        eyebrow="Dịch vụ"
        title={home.featuredPackages.heading || "Gói chụp nổi bật"}
        description={home.featuredPackages.description}
        actionHref="/goi-chup"
        actionLabel="Xem tất cả gói chụp"
      />
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {home.featuredPackages.packages.map((packageItem) => (
          <HomePackageCardView
            key={packageItem.id}
            packageItem={packageItem}
          />
        ))}
      </div>
    </PublicSection>
  );
}

function FeaturedAlbumsSection({ home }: { home: PublicHome }) {
  return (
    <PublicSection>
      <SectionHeader
        eyebrow="Portfolio"
        title={home.featuredAlbums.heading || "Album nổi bật"}
        description={home.featuredAlbums.description}
        actionHref="/album"
        actionLabel="Xem tất cả album"
      />
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {home.featuredAlbums.albums.map((album) => (
          <HomeAlbumCardView key={album.id} album={album} />
        ))}
      </div>
    </PublicSection>
  );
}

function UspSection({ home }: { home: PublicHome }) {
  return (
    <PublicSection surface>
      <SectionHeader title={home.usp.heading || "Vì sao chọn chúng tôi"} />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {home.usp.items.map((item, index) => (
          <article
            key={`${item.title}-${index}`}
            className="border-t border-[var(--color-border)] pt-5"
          >
            <p className="section-eyebrow">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3
              className="mt-4 text-2xl font-semibold leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {item.title}
            </h3>
            {item.description ? (
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                {item.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </PublicSection>
  );
}

function TestimonialsSection({ home }: { home: PublicHome }) {
  return (
    <PublicSection>
      <SectionHeader title={home.testimonials.heading || "Cảm nhận khách hàng"} />
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {home.testimonials.items.map((item, index) => (
          <figure key={`${item.customerName}-${index}`} className="public-card p-7">
            <blockquote className="text-lg leading-8 text-[var(--color-text)]">
              “{item.content}”
            </blockquote>
            {item.customerName ? (
              <figcaption className="mt-6 text-sm font-extrabold text-[var(--color-accent)]">
                {item.customerName}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </PublicSection>
  );
}

function LatestPostsSection({ home }: { home: PublicHome }) {
  return (
    <PublicSection surface>
      <SectionHeader
        eyebrow="Bài viết"
        title={home.latestPosts.heading || "Bài viết mới"}
        description={home.latestPosts.description}
        actionHref="/tin-tuc"
        actionLabel="Xem tất cả bài viết"
      />
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {home.latestPosts.posts.map((post) => (
          <HomePostCardView key={post.id} post={post} />
        ))}
      </div>
    </PublicSection>
  );
}

function LocationsSection({ home }: { home: PublicHome }) {
  return (
    <PublicSection>
      <SectionHeader
        eyebrow="Cơ sở"
        title={home.locations.heading || "Cơ sở Studio"}
        description={home.locations.description}
        actionHref="/dia-diem"
        actionLabel="Xem tất cả cơ sở"
      />
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {home.locations.locations.map((location) => (
          <HomeLocationCardView key={location.id} location={location} />
        ))}
      </div>
    </PublicSection>
  );
}

function BookingCtaSection({ home }: { home: PublicHome }) {
  const heading = home.bookingCta.heading || "Đặt lịch chụp";

  return (
    <section className="relative isolate overflow-hidden py-16 md:py-24">
      {home.bookingCta.background ? (
        <Image
          src={getMediaAssetUrl(home.bookingCta.background.url)}
          alt={home.bookingCta.background.alt || heading}
          fill
          sizes="100vw"
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-[var(--color-primary)]" />
      {home.bookingCta.background ? <div className="absolute inset-0 bg-black/56" /> : null}
      <div className="site-container relative z-10">
        <div className="max-w-2xl text-white">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/72">
            Tư vấn lịch chụp
          </p>
          <h2
            className="mt-4 text-4xl font-semibold leading-tight md:text-6xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {heading}
          </h2>
          {home.bookingCta.description ? (
            <p className="mt-5 text-base leading-8 text-white/82">
              {home.bookingCta.description}
            </p>
          ) : null}
          <Link href="/dat-lich" className="theme-button-primary mt-8">
            {home.bookingCta.buttonLabel || "Đặt lịch chụp"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function PublicSection({
  children,
  surface = false,
}: {
  children: ReactNode;
  surface?: boolean;
}) {
  return (
    <section className={`public-section ${surface ? "public-section--surface" : ""}`}>
      <div className="site-container">{children}</div>
    </section>
  );
}

function OrganizationJsonLd({ settings }: { settings: PublicSettings }) {
  const siteUrl = getSiteUrl();
  const logo = settings.logo
    ? getMediaAssetUrl(settings.logo.url)
    : undefined;
  const sameAs = Object.values(settings.socials).filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.studioName,
    ...(siteUrl ? { url: siteUrl.toString() } : {}),
    ...(logo ? { logo } : {}),
    ...(settings.contact.phone ? { telephone: settings.contact.phone } : {}),
    ...(settings.contact.email ? { email: settings.contact.email } : {}),
    ...(settings.contact.address
      ? { address: settings.contact.address }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
