import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicButtonLink, SectionHeader } from "@/components/ui/public-ui";
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
    about.seo.title || `Giới thiệu | ${settings.studioName}`;
  const description =
    about.seo.description ||
    about.story.plainText ||
    about.hero.subtitle ||
    settings.defaultSeo.description ||
    settings.tagline ||
    "Câu chuyện, phong cách và đội ngũ đứng sau Studio.";
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
  const heroTitle = about.hero.title || "Giới thiệu";

  return (
    <main>
      <section className="public-section">
        <div className="site-container grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
          <header>
            <p className="section-eyebrow">{about.hero.eyebrow || "Studio"}</p>
            <h1 className="display-heading">{heroTitle}</h1>
            {about.hero.subtitle ? (
              <p className="page-hero__lead">{about.hero.subtitle}</p>
            ) : null}
          </header>

          <div className="image-frame aspect-[4/3]">
            {about.hero.media ? (
              <Image
                src={getMediaAssetUrl(about.hero.media.url)}
                alt={about.hero.media.alt || heroTitle}
                fill
                priority
                sizes="(min-width: 1024px) 54vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="media-fallback">Studio</div>
            )}
          </div>
        </div>
      </section>

      {about.story.heading || about.story.contentHtml || about.story.media ? (
        <section className="public-section public-section--surface">
          <div className="site-container grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <SectionHeader
                eyebrow="Câu chuyện"
                title={about.story.heading || "Câu chuyện của Studio"}
              />
              {about.story.contentHtml ? (
                <div
                  className="cms-rich-text mt-8"
                  dangerouslySetInnerHTML={{
                    __html: about.story.contentHtml,
                  }}
                />
              ) : null}
            </div>
            {about.story.media ? (
              <div className="image-frame aspect-[4/5]">
                <Image
                  src={getMediaAssetUrl(about.story.media.url)}
                  alt={about.story.media.alt || about.story.heading || heroTitle}
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
        <section className="public-section">
          <div className="site-container">
            <SectionHeader
              eyebrow="Phong cách"
              title={about.philosophy.heading || "Giá trị và phong cách"}
            />
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {about.philosophy.items.map((item, index) => (
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
          </div>
        </section>
      ) : null}

      {about.metrics.length > 0 ? (
        <section className="public-section public-section--surface">
          <div className="site-container grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {about.metrics.map((metric, index) => (
              <div
                key={`${metric.value}-${index}`}
                className="border-t border-[var(--color-border)] pt-6"
              >
                <p
                  className="text-5xl font-semibold text-[var(--color-accent)]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {metric.value}
                </p>
                <p className="mt-3 text-sm font-semibold text-[var(--color-muted)]">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {about.team.enabled && about.team.members.length > 0 ? (
        <section className="public-section">
          <div className="site-container">
            <SectionHeader
              eyebrow="Đội ngũ"
              title={about.team.heading || "Những người đứng sau ống kính"}
            />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {about.team.members.map((member, index) => (
                <article key={`${member.name}-${index}`} className="public-card">
                  <div className="image-frame aspect-[4/3]">
                    {member.media ? (
                      <Image
                        src={getMediaAssetUrl(member.media.url)}
                        alt={member.media.alt || member.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="media-fallback">Đội ngũ</div>
                    )}
                  </div>
                  <div className="p-5 md:p-6">
                    <h3
                      className="text-2xl font-semibold leading-tight"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {member.name}
                    </h3>
                    {member.role ? (
                      <p className="mt-2 text-sm font-extrabold text-[var(--color-accent)]">
                        {member.role}
                      </p>
                    ) : null}
                    {member.bio ? (
                      <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
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

      {about.gallery.length > 0 ? (
        <section className="public-section public-section--surface">
          <div className="site-container">
            <SectionHeader eyebrow="Không gian" title="Hình ảnh Studio" />
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {about.gallery.map((image) => (
                <div key={image.id} className="image-frame aspect-[4/3]">
                  <Image
                    src={getMediaAssetUrl(image.medium.url)}
                    alt={image.alt || "Hình ảnh Studio"}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {about.bookingCta.heading || about.bookingCta.description ? (
        <section className="public-section">
          <div className="site-container">
            <div className="border-t border-[var(--color-border)] pt-10">
              <SectionHeader
                eyebrow="Tư vấn lịch chụp"
                title={about.bookingCta.heading || "Cùng Studio lên kế hoạch buổi chụp"}
                description={about.bookingCta.description}
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <PublicButtonLink href="/dat-lich">
                  {about.bookingCta.buttonLabel || "Đặt lịch chụp"}
                </PublicButtonLink>
                <Link href="/album" className="theme-button-secondary">
                  Xem album
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
