import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMediaAssetUrl } from "@/lib/api/client";
import {
  getPostBySlug,
  type PublicMediaPreview,
  type PublicPostDetail,
} from "@/lib/api/posts";

const LIST_TITLE = "Tin t\u1ee9c";

interface ArticleDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Kh\u00f4ng t\u00ecm th\u1ea5y b\u00e0i vi\u1ebft | Studio",
    };
  }

  const title = post.seo.title || post.title;
  const description = post.seo.description || post.excerpt || post.title;
  const ogImage = getOpenGraphImage(post);

  return {
    title: `${title} | Studio`,
    description,
    alternates: {
      canonical: getCanonicalPath(`/tin-tuc/${post.slug}`),
    },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      images: ogImage
        ? [
            {
              url: getMediaAssetUrl(ogImage.url),
              width: ogImage.width,
              height: ogImage.height,
              alt: ogImage.alt || post.title,
            },
          ]
        : undefined,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: ArticleDetailPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = createBlogPostingJsonLd(post);

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <article className="mx-auto w-full max-w-6xl px-6 py-10">
        <nav className="text-sm text-zinc-500">
          <Link href="/tin-tuc" className="font-medium hover:text-zinc-900">
            {LIST_TITLE}
          </Link>
          <span className="px-2">/</span>
          <span>{post.title}</span>
        </nav>

        <header className="mx-auto mt-6 max-w-3xl border-b border-zinc-200 pb-8">
          {post.category ? (
            <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
              {post.category.name}
            </p>
          ) : null}
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">
            {post.title}
          </h1>
          {post.publishedAt ? (
            <p className="mt-4 text-sm text-zinc-500">
              {formatDate(post.publishedAt)}
            </p>
          ) : null}
          {post.excerpt ? (
            <p className="mt-6 text-lg leading-8 text-zinc-600">
              {post.excerpt}
            </p>
          ) : null}
        </header>

        {post.cover ? (
          <div className="mx-auto mt-8 max-w-5xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-zinc-100">
              <Image
                src={getMediaAssetUrl(post.cover.url)}
                alt={post.cover.alt || post.title}
                fill
                priority
                sizes="(min-width: 1024px) 960px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        {post.contentHtml ? (
          <section className="mx-auto mt-8 max-w-3xl">
            {/* contentHtml is persisted only after backend sanitize-html policy. Do not render unsanitized editor state here. */}
            <div
              className="article-prose text-base leading-8 text-zinc-700 [&_a]:font-semibold [&_a]:text-emerald-700 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-5 [&_blockquote]:text-zinc-600 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_h2]:mb-3 [&_h2]:mt-9 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-7 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-semibold [&_hr]:my-8 [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-zinc-950 [&_pre]:p-4 [&_pre]:text-zinc-50 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
          </section>
        ) : null}

        {post.tags.length > 0 ? (
          <footer className="mx-auto mt-8 flex max-w-3xl flex-wrap gap-2 border-t border-zinc-200 pt-6">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tin-tuc?tag=${encodeURIComponent(tag)}`}
                className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
              >
                {tag}
              </Link>
            ))}
          </footer>
        ) : null}
      </article>
    </main>
  );
}

function getOpenGraphImage(post: PublicPostDetail): PublicMediaPreview | null {
  if (post.seo.ogImage) {
    return post.seo.ogImage;
  }

  return post.cover;
}

function createBlogPostingJsonLd(post: PublicPostDetail) {
  const image = getOpenGraphImage(post);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo.description || post.excerpt || post.title,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    mainEntityOfPage: getCanonicalPath(`/tin-tuc/${post.slug}`),
    image: image ? getMediaAssetUrl(image.url) : undefined,
    publisher: {
      "@type": "Organization",
      name: "Studio",
    },
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
    return path;
  }

  return new URL(path, siteUrl).toString();
}
