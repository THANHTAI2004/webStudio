import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicButtonLink, SectionHeader, dateFormatter } from "@/components/ui/public-ui";
import { getMediaAssetUrl } from "@/lib/api/client";
import {
  getPostBySlug,
  getPosts,
  type PublicMediaPreview,
  type PublicPostDetail,
  type PublicPostListItem,
} from "@/lib/api/posts";

const LIST_TITLE = "Bài viết";

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
      title: "Không tìm thấy bài viết | Studio",
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

  const relatedResponse = post.category
    ? await getPosts({ page: 1, limit: 4, category: post.category.slug })
    : null;
  const relatedPosts =
    relatedResponse?.data.filter((item) => item.id !== post.id).slice(0, 3) ??
    [];
  const jsonLd = createBlogPostingJsonLd(post);

  return (
    <main>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <article>
        <section className="public-section">
          <div className="site-container">
            <nav className="public-breadcrumb" aria-label="Đường dẫn">
              <Link href="/tin-tuc">{LIST_TITLE}</Link>
              <span>/</span>
              <span>{post.title}</span>
            </nav>

            <header className="mx-auto max-w-3xl text-center">
              <p className="section-eyebrow">
                {post.category?.name ?? "Bài viết"}
              </p>
              <h1
                className="mt-4 text-4xl font-semibold leading-tight md:text-6xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {post.title}
              </h1>
              {post.publishedAt ? (
                <p className="mt-5 text-sm font-semibold text-[var(--color-muted)]">
                  {dateFormatter.format(new Date(post.publishedAt))}
                </p>
              ) : null}
              {post.excerpt ? (
                <p className="mt-6 text-lg leading-8 text-[var(--color-muted)]">
                  {post.excerpt}
                </p>
              ) : null}
            </header>

            {post.cover ? (
              <div className="mx-auto mt-10 max-w-5xl">
                <div className="image-frame aspect-[16/9]">
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
          </div>
        </section>

        {post.contentHtml ? (
          <section className="public-section public-section--surface">
            <div className="site-container">
              <div className="mx-auto max-w-3xl">
                {/* contentHtml is persisted only after backend sanitize-html policy. */}
                <div
                  className="article-prose [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-accent)] [&_blockquote]:pl-5 [&_code]:rounded [&_code]:bg-[var(--color-secondary)] [&_code]:px-1 [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-3xl [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-2xl [&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:text-xl [&_hr]:my-8 [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-5 [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-zinc-950 [&_pre]:p-4 [&_pre]:text-zinc-50 [&_ul]:list-disc [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                />
              </div>
            </div>
          </section>
        ) : null}

        {post.tags.length > 0 ? (
          <footer className="public-section">
            <div className="site-container">
              <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tin-tuc?tag=${encodeURIComponent(tag)}`}
                    className="category-chip"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </footer>
        ) : null}

        {relatedPosts.length > 0 ? (
          <section className="public-section public-section--surface">
            <div className="site-container">
              <SectionHeader
                eyebrow="Đọc tiếp"
                title="Bài viết liên quan"
                actionHref="/tin-tuc"
                actionLabel="Xem tất cả bài viết"
              />
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {relatedPosts.map((item) => (
                  <RelatedPostCard key={item.id} post={item} />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="public-section">
            <div className="site-container text-center">
              <PublicButtonLink href="/tin-tuc" variant="secondary">
                Xem thêm bài viết
              </PublicButtonLink>
            </div>
          </section>
        )}
      </article>
    </main>
  );
}

function RelatedPostCard({ post }: { post: PublicPostListItem }) {
  return (
    <article className="public-card">
      <Link href={`/tin-tuc/${post.slug}`} className="image-link aspect-[4/3]">
        {post.cover ? (
          <Image
            src={getMediaAssetUrl(post.cover.url)}
            alt={post.cover.alt || post.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="media-fallback">Bài viết</span>
        )}
      </Link>
      <div className="p-5">
        <p className="section-eyebrow">{post.category?.name ?? "Bài viết"}</p>
        <h2
          className="mt-3 text-2xl font-semibold leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Link href={`/tin-tuc/${post.slug}`}>{post.title}</Link>
        </h2>
      </div>
    </article>
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

function getCanonicalPath(path: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return path;
  }

  return new URL(path, siteUrl).toString();
}
