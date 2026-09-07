import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumLightbox } from "@/components/albums/album-lightbox";
import { getMediaAssetUrl } from "@/lib/api/client";
import {
  getAlbumBySlug,
  type PublicAlbumDetail,
  type PublicMediaPreview,
} from "@/lib/api/albums";

const LIST_TITLE = "Album \u1ea3nh";

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
      title: "Album not found | Studio",
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
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <article className="mx-auto w-full max-w-6xl px-6 py-10">
        <nav className="text-sm text-zinc-500">
          <Link href="/album" className="font-medium hover:text-zinc-900">
            {LIST_TITLE}
          </Link>
          <span className="px-2">/</span>
          <span>{album.title}</span>
        </nav>

        <header className="mt-6 grid gap-8 border-b border-zinc-200 pb-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div>
            {album.category ? (
              <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
                {album.category.name}
              </p>
            ) : null}
            <h1 className="mt-3 text-4xl font-semibold tracking-normal">
              {album.title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-zinc-600">
              {album.location ? (
                <p className="rounded-md border border-zinc-200 bg-white px-3 py-2 font-semibold">
                  {album.location}
                </p>
              ) : null}
              {album.shootingDate ? (
                <p className="rounded-md border border-zinc-200 bg-white px-3 py-2 font-semibold">
                  {formatDate(album.shootingDate)}
                </p>
              ) : null}
            </div>

            {album.description ? (
              <p className="mt-6 whitespace-pre-line text-base leading-7 text-zinc-600">
                {album.description}
              </p>
            ) : null}
          </div>

          {album.cover ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100">
              <Image
                src={getMediaAssetUrl(album.cover.url)}
                alt={album.cover.alt || album.title}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </header>

        {album.gallery.length > 0 ? (
          <section className="border-b border-zinc-200 py-8">
            <AlbumLightbox images={album.gallery} albumTitle={album.title} />
          </section>
        ) : null}

        {album.content ? (
          <section className="py-8">
            <h2 className="text-lg font-semibold">Story</h2>
            <p className="mt-4 whitespace-pre-line text-base leading-8 text-zinc-700">
              {album.content}
            </p>
          </section>
        ) : null}
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getCanonicalPath(path: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl).toString();
}
