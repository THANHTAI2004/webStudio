import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumLightbox } from "@/components/albums/album-lightbox";
import { PublicButtonLink, SectionHeader, dateFormatter } from "@/components/ui/public-ui";
import { getMediaAssetUrl } from "@/lib/api/client";
import {
  getAlbumBySlug,
  type PublicAlbumDetail,
  type PublicMediaPreview,
} from "@/lib/api/albums";

const LIST_TITLE = "Album ảnh";

interface AlbumDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: AlbumDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) {
    return {
      title: "Không tìm thấy album | Studio",
    };
  }

  const title = album.seo.title || album.title;
  const description = album.seo.description || album.description || album.title;
  const ogImage = getOpenGraphImage(album);

  return {
    title: `${title} | Studio`,
    description,
    alternates: {
      canonical: getCanonicalPath(`/album/${album.slug}`),
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
              alt: ogImage.alt || album.title,
            },
          ]
        : undefined,
    },
  };
}

export default async function AlbumDetailPage({
  params,
}: AlbumDetailPageProps) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  const jsonLd = createImageGalleryJsonLd(album);

  return (
    <main>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <article>
        <section className="public-section">
          <div className="site-container">
            <nav className="public-breadcrumb" aria-label="Đường dẫn">
              <Link href="/album">{LIST_TITLE}</Link>
              <span>/</span>
              <span>{album.title}</span>
            </nav>

            <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
              <header>
                <p className="section-eyebrow">
                  {album.category?.name ?? "Portfolio"}
                </p>
                <h1 className="display-heading">{album.title}</h1>
                <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-[var(--color-muted)]">
                  {album.location ? <span>{album.location}</span> : null}
                  {album.shootingDate ? (
                    <span>{dateFormatter.format(new Date(album.shootingDate))}</span>
                  ) : null}
                </div>
                {album.description ? (
                  <p className="page-hero__lead">{album.description}</p>
                ) : null}
              </header>

              {album.cover ? (
                <div className="image-frame aspect-[4/3]">
                  <Image
                    src={getMediaAssetUrl(album.cover.url)}
                    alt={album.cover.alt || album.title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 54vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {album.gallery.length > 0 ? (
          <section className="public-section public-section--surface">
            <div className="site-container">
              <SectionHeader
                eyebrow="Bộ ảnh"
                title="Khoảnh khắc được chọn lọc"
                description="Bấm vào từng ảnh để xem rõ hơn trong chế độ toàn màn hình."
              />
              <div className="mt-10">
                <AlbumLightbox images={album.gallery} albumTitle={album.title} />
              </div>
            </div>
          </section>
        ) : null}

        {album.content ? (
          <section className="public-section">
            <div className="site-container">
              <div className="mx-auto max-w-3xl">
                <SectionHeader eyebrow="Câu chuyện" title="Câu chuyện bộ ảnh" />
                <div className="cms-rich-text mt-8 whitespace-pre-line text-lg">
                  {album.content}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="public-section">
          <div className="site-container">
            <div className="border-t border-[var(--color-border)] pt-10">
              <SectionHeader
                title="Muốn thực hiện một bộ ảnh tương tự?"
                description="Gửi thông tin buổi chụp, Studio sẽ tư vấn gói và thời gian phù hợp."
              />
              <div className="mt-8">
                <PublicButtonLink href="/dat-lich">Đặt lịch chụp</PublicButtonLink>
              </div>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}

function getOpenGraphImage(
  album: PublicAlbumDetail,
): PublicMediaPreview | null {
  if (album.seo.ogImage) {
    return album.seo.ogImage;
  }

  if (album.cover) {
    return album.cover;
  }

  const firstGalleryImage = album.gallery[0];

  return firstGalleryImage
    ? {
        id: firstGalleryImage.id,
        url: firstGalleryImage.large.url,
        width: firstGalleryImage.large.width,
        height: firstGalleryImage.large.height,
        alt: firstGalleryImage.alt,
      }
    : null;
}

function createImageGalleryJsonLd(album: PublicAlbumDetail) {
  const images = [
    album.cover ? getMediaAssetUrl(album.cover.url) : null,
    ...album.gallery.map((image) => getMediaAssetUrl(image.large.url)),
  ]
    .filter((image): image is string => Boolean(image))
    .slice(0, 20);

  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: album.title,
    description: album.seo.description || album.description || album.title,
    url: getCanonicalPath(`/album/${album.slug}`),
    image: images,
  };
}

function getCanonicalPath(path: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl).toString();
}
