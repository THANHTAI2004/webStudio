import Image from "next/image";
import Link from "next/link";
import { currencyFormatter, dateFormatter } from "@/components/ui/public-ui";
import { getMediaAssetUrl } from "@/lib/api/client";
import type {
  HomeAlbumCard,
  HomeLocationCard,
  HomePackageCard,
  HomePostCard,
} from "@/lib/api/home";

export function HomePackageCardView({
  packageItem,
}: {
  packageItem: HomePackageCard;
}) {
  return (
    <article className="public-card">
      <Link
        href={`/goi-chup/${packageItem.slug}`}
        className="image-link aspect-[4/3]"
      >
        {packageItem.thumbnail ? (
          <Image
            src={getMediaAssetUrl(packageItem.thumbnail.url)}
            alt={packageItem.thumbnail.alt || packageItem.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="media-fallback">Gói chụp</span>
        )}
      </Link>
      <div className="p-5 md:p-6">
        <p className="section-eyebrow">
          {packageItem.category?.name ?? "Dịch vụ"}
        </p>
        <h3
          className="mt-3 text-2xl font-semibold leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Link href={`/goi-chup/${packageItem.slug}`}>{packageItem.name}</Link>
        </h3>
        {packageItem.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--color-muted)]">
            {packageItem.description}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <p className="text-xl font-semibold">
            {currencyFormatter.format(packageItem.salePrice ?? packageItem.price)}
          </p>
          {packageItem.salePrice !== null ? (
            <p className="text-sm text-[var(--color-muted)] line-through">
              {currencyFormatter.format(packageItem.price)}
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/goi-chup/${packageItem.slug}`}
            className="theme-button-secondary"
          >
            Xem chi tiết
          </Link>
          <Link
            href={`/dat-lich?package=${packageItem.slug}`}
            className="theme-button-primary"
          >
            Đặt lịch
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HomeAlbumCardView({ album }: { album: HomeAlbumCard }) {
  return (
    <article className="public-card">
      <Link href={`/album/${album.slug}`} className="image-link aspect-[4/3]">
        {album.cover ? (
          <Image
            src={getMediaAssetUrl(album.cover.url)}
            alt={album.cover.alt || album.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="media-fallback">Album</span>
        )}
      </Link>
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap gap-2">
          {album.category ? <p className="section-eyebrow">{album.category.name}</p> : null}
          {album.shootingDate ? (
            <p className="text-xs font-bold text-[var(--color-muted)]">
              {dateFormatter.format(new Date(album.shootingDate))}
            </p>
          ) : null}
        </div>
        <h3
          className="mt-3 text-2xl font-semibold leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Link href={`/album/${album.slug}`}>{album.title}</Link>
        </h3>
        {album.location ? (
          <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">
            {album.location}
          </p>
        ) : null}
        {album.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--color-muted)]">
            {album.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function HomePostCardView({ post }: { post: HomePostCard }) {
  return (
    <article className="public-card">
      <Link href={`/tin-tuc/${post.slug}`} className="image-link aspect-[16/10]">
        {post.cover ? (
          <Image
            src={getMediaAssetUrl(post.cover.url)}
            alt={post.cover.alt || post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="media-fallback">Bài viết</span>
        )}
      </Link>
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap gap-2">
          <p className="section-eyebrow">{post.category?.name ?? "Bài viết"}</p>
          {post.publishedAt ? (
            <p className="text-xs font-bold text-[var(--color-muted)]">
              {dateFormatter.format(new Date(post.publishedAt))}
            </p>
          ) : null}
        </div>
        <h3
          className="mt-3 text-2xl font-semibold leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Link href={`/tin-tuc/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--color-muted)]">
            {post.excerpt}
          </p>
        ) : null}
        <Link
          href={`/tin-tuc/${post.slug}`}
          className="mt-6 inline-flex text-sm font-extrabold text-[var(--color-primary)] underline decoration-[var(--color-accent)] underline-offset-4"
        >
          Đọc bài viết
        </Link>
      </div>
    </article>
  );
}

export function HomeLocationCardView({
  location,
}: {
  location: HomeLocationCard;
}) {
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
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="media-fallback">Cơ sở</span>
        )}
      </Link>
      <div className="p-5 md:p-6">
        <p className="section-eyebrow">Cơ sở</p>
        <h3
          className="mt-3 text-2xl font-semibold leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Link href={`/dia-diem/${location.slug}`}>{location.name}</Link>
        </h3>
        {location.address ? (
          <p className="mt-3 line-clamp-2 text-sm leading-7 text-[var(--color-muted)]">
            {location.address}
          </p>
        ) : null}
        {location.phone ? (
          <a
            href={`tel:${location.phone}`}
            className="mt-4 inline-flex text-sm font-extrabold text-[var(--color-primary)]"
          >
            {location.phone}
          </a>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/dia-diem/${location.slug}`}
            className="theme-button-secondary"
          >
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
