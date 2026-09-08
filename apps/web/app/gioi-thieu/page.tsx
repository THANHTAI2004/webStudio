import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getMediaAssetUrl } from "@/lib/api/client";
import { getPublicAbout } from "@/lib/api/about";
import { getPublicSettings } from "@/lib/api/settings";
import { getCanonicalUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, about] = await Promise.all([
    getPublicSettings({ cache: "no-store" }),
    getPublicAbout({ cache: "no-store" }),
  ]);
  const title =
    about.seo.title || `Gi\u1edbi thi\u1ec7u | ${settings.studioName}`;
  const description =
    about.seo.description ||
    about.story.plainText ||
    about.hero.subtitle ||
    settings.defaultSeo.description ||
    settings.tagline ||
    "Studio photography services.";
  const ogImage =
    about.seo.ogImage ?? about.hero.media ?? settings.defaultSeo.ogImage;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl("/gioi-thieu"),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl("/gioi-thieu"),
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

export default async function AboutPage() {
  const about = await getPublicAbout({ cache: "no-store" });

  return (
    <main>
      <section className="py-14 md:py-20">
        <div className="site-container grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div>
            {about.hero.eyebrow ? (
              <p
                className="text-sm font-bold uppercase tracking-normal"
                style={{ color: "var(--color-primary)" }}
              >
                {about.hero.eyebrow}
              </p>
            ) : null}
            <h1
              className="mt-4 text-5xl font-semibold leading-tight md:text-7xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {about.hero.title || "Gi\u1edbi thi\u1ec7u"}
            </h1>
            {about.hero.subtitle ? (
              <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600 md:text-lg">
                {about.hero.subtitle}
              </p>
            ) : null}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden theme-card">
            {about.hero.media ? (
              <Image
                src={getMediaAssetUrl(about.hero.media.url)}
                alt={about.hero.media.alt || about.hero.title}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                Studio
              </div>
            )}
          </div>
        </div>
      </section>

      {about.story.heading || about.story.contentHtml || about.story.media ? (
        <section
          className="py-16 md:py-20"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <div className="site-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              {about.story.heading ? (
                <h2
                  className="text-3xl font-semibold leading-tight md:text-5xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {about.story.heading}
                </h2>
              ) : null}
              {about.story.contentHtml ? (
                <div
                  className="cms-rich-text mt-6"
                  dangerouslySetInnerHTML={{
                    __html: about.story.contentHtml,
                  }}
                />
              ) : null}
            </div>
            {about.story.media ? (
              <div className="relative aspect-[4/3] overflow-hidden theme-card">
                <Image
                  src={getMediaAssetUrl(about.story.media.url)}
                  alt={about.story.media.alt || about.story.heading}
                  fill
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {about.philosophy.items.length > 0 ? (
        <section className="py-16 md:py-20">
          <div className="site-container">
            {about.philosophy.heading ? (
              <h2
                className="max-w-2xl text-3xl font-semibold leading-tight md:text-5xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {about.philosophy.heading}
              </h2>
            ) : null}
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {about.philosophy.items.map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="theme-card p-5"
                >
                  <h3
                    className="text-lg font-semibold"
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
          </div>
        </section>
      ) : null}

      {about.team.enabled && about.team.members.length > 0 ? (
        <section
          className="py-16 md:py-20"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <div className="site-container">
            {about.team.heading ? (
              <h2
                className="max-w-2xl text-3xl font-semibold leading-tight md:text-5xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {about.team.heading}
              </h2>
            ) : null}
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {about.team.members.map((member, index) => (
                <article
                  key={`${member.name}-${index}`}
                  className="theme-card overflow-hidden"
                >
                  <div className="relative aspect-[4/3] bg-zinc-100">
                    {member.media ? (
                      <Image
                        src={getMediaAssetUrl(member.media.url)}
                        alt={member.media.alt || member.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                        Team
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3
                      className="text-xl font-semibold"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {member.name}
                    </h3>
                    {member.role ? (
                      <p
                        className="mt-1 text-sm font-bold"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {member.role}
                      </p>
                    ) : null}
                    {member.bio ? (
                      <p className="mt-3 text-sm leading-6 text-zinc-600">
                        {member.bio}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {about.metrics.length > 0 ? (
        <section className="py-16 md:py-20">
          <div className="site-container grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {about.metrics.map((metric, index) => (
              <div key={`${metric.value}-${index}`} className="theme-card p-6">
                <p
                  className="text-4xl font-semibold"
                  style={{
                    color: "var(--color-primary)",
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  {metric.value}
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-600">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {about.gallery.length > 0 ? (
        <section
          className="py-16 md:py-20"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <div className="site-container grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {about.gallery.map((image) => (
              <div
                key={image.id}
                className="relative aspect-[4/3] overflow-hidden theme-card"
              >
                <Image
                  src={getMediaAssetUrl(image.medium.url)}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {about.bookingCta.heading || about.bookingCta.description ? (
        <section className="py-16 md:py-20">
          <div className="site-container">
            <div
              className="p-8 text-center md:p-12 theme-card"
              style={{ backgroundColor: "var(--color-secondary)" }}
            >
              <h2
                className="text-3xl font-semibold text-white md:text-5xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {about.bookingCta.heading}
              </h2>
              {about.bookingCta.description ? (
                <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/80">
                  {about.bookingCta.description}
                </p>
              ) : null}
              <Link href="/dat-lich" className="theme-button-primary mt-7">
                {about.bookingCta.buttonLabel || "\u0110\u1eb7t l\u1ecbch"}
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
