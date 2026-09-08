import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PublicButtonLink,
  SectionHeader,
  currencyFormatter,
} from "@/components/ui/public-ui";
import { getMediaAssetUrl } from "@/lib/api/client";
import {
  getPackageBySlug,
  type PublicMediaPreview,
  type PublicPackageDetail,
} from "@/lib/api/packages";

const LIST_TITLE = "Gói chụp";

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
      title: "Không tìm thấy gói chụp | Studio",
    };
  }

  const title = packageItem.seo.title || packageItem.name;
  const description =
    packageItem.seo.description || packageItem.description || packageItem.name;
  const ogImage =
    packageItem.seo.ogImage || packageItem.thumbnail || packageItem.gallery[0];

  return {
    title: `${title} | Studio`,
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
  const heroImage = packageItem.thumbnail ?? packageItem.gallery[0] ?? null;
  const gallery = getUniqueGallery(packageItem);

  return (
    <main>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <article className="public-section">
        <div className="site-container">
          <nav className="public-breadcrumb" aria-label="Đường dẫn">
            <Link href="/goi-chup">{LIST_TITLE}</Link>
            <span>/</span>
            <span>{packageItem.name}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_400px] lg:items-start">
            <div>
              <div className="image-frame aspect-[4/3]">
                {heroImage ? (
                  <Image
                    src={getMediaAssetUrl(heroImage.url)}
                    alt={heroImage.alt || packageItem.name}
                    fill
                    priority
                    sizes="(min-width: 1024px) 62vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="media-fallback">Gói chụp</div>
                )}
              </div>

              {gallery.length > 1 ? (
                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                  {gallery.slice(1, 7).map((image) => (
                    <div key={image.id} className="image-frame aspect-[4/3]">
                      <Image
                        src={getMediaAssetUrl(image.url)}
                        alt={image.alt || packageItem.name}
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-28">
              <div className="public-card p-6 md:p-7">
                <p className="section-eyebrow">
                  {packageItem.category?.name ?? "Dịch vụ"}
                </p>
                <h1
                  className="mt-3 text-4xl font-semibold leading-tight md:text-5xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {packageItem.name}
                </h1>
                {packageItem.description ? (
                  <p className="mt-5 whitespace-pre-line text-base leading-8 text-[var(--color-muted)]">
                    {packageItem.description}
                  </p>
                ) : null}

                <div className="mt-7 border-t border-[var(--color-border)] pt-6">
                  <div className="flex flex-wrap items-end gap-3">
                    <p className="text-3xl font-semibold">
                      {currencyFormatter.format(activePrice)}
                    </p>
                    {packageItem.salePrice !== null ? (
                      <p className="text-base text-[var(--color-muted)] line-through">
                        {currencyFormatter.format(packageItem.price)}
                      </p>
                    ) : null}
                  </div>
                  {packageItem.durationMinutes ? (
                    <p className="mt-3 text-sm font-semibold text-[var(--color-muted)]">
                      Thời lượng: {packageItem.durationMinutes} phút
                    </p>
                  ) : null}
                </div>

                {packageItem.features.length > 0 ? (
                  <ul className="mt-7 grid gap-3 text-sm leading-6">
                    {packageItem.features.slice(0, 6).map((feature) => (
                      <li
                        key={feature}
                        className="border-l-2 border-[var(--color-accent)] pl-3 text-[var(--color-text)]"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-8 grid gap-3">
                  <PublicButtonLink
                    href={`/dat-lich?package=${packageItem.slug}`}
                  >
                    Đặt lịch gói này
                  </PublicButtonLink>
                  <PublicButtonLink href="/lien-he" variant="secondary">
                    Cần tư vấn thêm
                  </PublicButtonLink>
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[320px_1fr]">
            <SectionHeader
              eyebrow="Chi tiết"
              title="Trải nghiệm trong gói"
              description="Thông tin bên dưới giúp bạn hình dung rõ hơn về phong cách, nội dung và cách Studio chuẩn bị cho buổi chụp."
            />

            <div>
              {packageItem.content || packageItem.description ? (
                <div className="cms-rich-text whitespace-pre-line text-lg">
                  {packageItem.content || packageItem.description}
                </div>
              ) : (
                <p className="text-base leading-8 text-[var(--color-muted)]">
                  Studio sẽ tư vấn chi tiết nội dung gói chụp khi liên hệ xác
                  nhận lịch.
                </p>
              )}

              {packageItem.features.length > 0 ? (
                <div className="mt-10 grid gap-3 md:grid-cols-2">
                  {packageItem.features.map((feature) => (
                    <div
                      key={feature}
                      className="theme-card px-4 py-3 text-sm font-semibold"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}

function getUniqueGallery(packageItem: PublicPackageDetail) {
  const images = [
    packageItem.thumbnail,
    ...packageItem.gallery,
  ].filter((image): image is PublicMediaPreview => Boolean(image));
  const seen = new Set<string>();

  return images.filter((image) => {
    if (seen.has(image.id)) {
      return false;
    }

    seen.add(image.id);
    return true;
  });
}

function createServiceJsonLd(packageItem: PublicPackageDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: packageItem.name,
    description: packageItem.description,
    serviceType: packageItem.category?.name ?? "Dịch vụ chụp ảnh",
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
