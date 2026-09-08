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
    "Studio photography services.";
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
  const sections = home.sectionOrder
    .map((sectionKey) => renderHomeSection(sectionKey, home));
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

  return (
    <section
      className="relative isolate min-h-[calc(100vh-150px)] overflow-hidden"
      style={{ backgroundColor: "var(--color-secondary)" }}
    >
      {home.hero.background ? (
        <Image
          src={getMediaAssetUrl(home.hero.background.url)}
          alt={home.hero.background.alt || title}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,.68), rgba(0,0,0,.28), rgba(0,0,0,.12))",
        }}
      />
      <div className="site-container relative z-10 flex min-h-[calc(100vh-150px)] items-center py-20">
        <div className="max-w-3xl text-white">
          {home.hero.eyebrow ? (
            <p className="text-sm font-bold uppercase tracking-normal">
              {home.hero.eyebrow}
            </p>
          ) : null}
          <h1
            className="mt-4 text-5xl font-semibold leading-tight md:text-7xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {title}
          </h1>
          {home.hero.subtitle ? (
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
              {home.hero.subtitle}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <SmartLink
              href={home.hero.primaryCta.href}
              className="theme-button-primary"
            >
              {home.hero.primaryCta.label || "\u0110\u1eb7t l\u1ecbch"}
            </SmartLink>
            {home.hero.secondaryCta.label ? (
              <SmartLink
                href={home.hero.secondaryCta.href}
                className="theme-button-secondary"
              >
                {home.hero.secondaryCta.label}
              </SmartLink>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutPreviewSection({ home }: { home: PublicHome }) {
  return (
    <section className="py-16 md:py-20">
      <div className="site-container grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="relative aspect-[4/3] overflow-hidden theme-card">
          {home.aboutPreview.media ? (
            <Image
              src={getMediaAssetUrl(home.aboutPreview.media.url)}
              alt={home.aboutPreview.media.alt || home.aboutPreview.heading}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Studio
            </div>
          )}
        </div>
        <div>
          <SectionHeading
            title={home.aboutPreview.heading || "Gioi thieu"}
            description={home.aboutPreview.description}
          />
          <Link href="/gioi-thieu" className="theme-button-primary mt-7">
            {home.aboutPreview.buttonLabel || "Gioi thieu"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturedPackagesSection({ home }: { home: PublicHome }) {
  return (
    <ContentBand>
      <SectionHeaderRow
        title={home.featuredPackages.heading || "Goi chup"}
        description={home.featuredPackages.description}
        href="/goi-chup"
        cta="Xem t\u1ea5t c\u1ea3 g\u00f3i ch\u1ee5p"
      />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {home.featuredPackages.packages.map((packageItem) => (
          <HomePackageCardView
            key={packageItem.id}
            packageItem={packageItem}
          />
        ))}
      </div>
    </ContentBand>
  );
}

function FeaturedAlbumsSection({ home }: { home: PublicHome }) {
  return (
    <section className="py-16 md:py-20">
      <div className="site-container">
        <SectionHeaderRow
          title={home.featuredAlbums.heading || "Album"}
          description={home.featuredAlbums.description}
          href="/album"
          cta="Xem t\u1ea5t c\u1ea3 album"
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {home.featuredAlbums.albums.map((album) => (
            <HomeAlbumCardView key={album.id} album={album} />
          ))}
        </div>
      </div>
    </section>
  );
}

function UspSection({ home }: { home: PublicHome }) {
  return (
    <ContentBand>
      <SectionHeading title={home.usp.heading || "Why choose us"} />
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {home.usp.items.map((item, index) => (
          <article key={`${item.title}-${index}`} className="theme-card p-5">
            <p
              className="text-sm font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3
              className="mt-4 text-lg font-semibold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {item.title}
            </h3>
            {item.description ? (
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {item.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </ContentBand>
  );
}

function TestimonialsSection({ home }: { home: PublicHome }) {
  return (
    <section className="py-16 md:py-20">
      <div className="site-container">
        <SectionHeading title={home.testimonials.heading || "Testimonials"} />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {home.testimonials.items.map((item, index) => (
            <figure key={`${item.customerName}-${index}`} className="theme-card p-6">
              <blockquote className="text-base leading-7">
                {item.content}
              </blockquote>
              {item.customerName ? (
                <figcaption
                  className="mt-5 text-sm font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  {item.customerName}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function LatestPostsSection({ home }: { home: PublicHome }) {
  return (
    <ContentBand>
      <SectionHeaderRow
        title={home.latestPosts.heading || "Tin tuc moi"}
        description={home.latestPosts.description}
        href="/tin-tuc"
        cta="Xem t\u1ea5t c\u1ea3 tin t\u1ee9c"
      />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {home.latestPosts.posts.map((post) => (
          <HomePostCardView key={post.id} post={post} />
        ))}
      </div>
    </ContentBand>
  );
}

function LocationsSection({ home }: { home: PublicHome }) {
  return (
    <section className="py-16 md:py-20">
      <div className="site-container">
        <SectionHeaderRow
          title={home.locations.heading || "Dia diem"}
          description={home.locations.description}
          href="/dia-diem"
          cta="Xem t\u1ea5t c\u1ea3 \u0111\u1ecba \u0111i\u1ec3m"
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {home.locations.locations.map((location) => (
            <HomeLocationCardView key={location.id} location={location} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BookingCtaSection({ home }: { home: PublicHome }) {
  const heading = home.bookingCta.heading || "Dat lich chup";

  return (
    <section className="py-16 md:py-20">
      <div className="site-container">
        <div
          className="relative isolate overflow-hidden p-8 md:p-12 theme-card"
          style={{ backgroundColor: "var(--color-secondary)" }}
        >
          {home.bookingCta.background ? (
            <Image
              src={getMediaAssetUrl(home.bookingCta.background.url)}
              alt={home.bookingCta.background.alt || heading}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 max-w-2xl text-white">
            <h2
              className="text-3xl font-semibold md:text-5xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {heading}
            </h2>
            {home.bookingCta.description ? (
              <p className="mt-4 text-base leading-8 text-white/85">
                {home.bookingCta.description}
              </p>
            ) : null}
            <Link href="/dat-lich" className="theme-button-primary mt-7">
              {home.bookingCta.buttonLabel || "\u0110\u1eb7t l\u1ecbch"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContentBand({ children }: { children: ReactNode }) {
  return (
    <section
      className="py-16 md:py-20"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <div className="site-container">{children}</div>
    </section>
  );
}

function SectionHeaderRow({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
      <SectionHeading title={title} description={description} />
      <Link href={href} className="theme-button-secondary">
        {cta}
      </Link>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="max-w-2xl">
      <h2
        className="text-3xl font-semibold leading-tight md:text-5xl"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-8 text-zinc-600">{description}</p>
      ) : null}
    </header>
  );
}

function SmartLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const normalizedHref = href || "/";

  if (/^https?:\/\//i.test(normalizedHref)) {
    return (
      <a
        href={normalizedHref}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={normalizedHref} className={className}>
      {children}
    </Link>
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
