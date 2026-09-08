import Image from "next/image";
import Link from "next/link";
import { getMediaAssetUrl } from "@/lib/api/client";
import type {
  HomeAlbumCard,
  HomeLocationCard,
  HomePackageCard,
  HomePostCard,
} from "@/lib/api/home";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function HomePackageCardView({
  packageItem,
}: {
  packageItem: HomePackageCard;
}) {
  return (
    <article className="theme-card overflow-hidden">
      <Link
        href={`/goi-chup/${packageItem.slug}`}
        className="relative block aspect-[4/3] bg-zinc-100"
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
          <span className="flex h-full items-center justify-center text-sm text-zinc-500">
            Studio Package
          </span>
        )}
      </Link>
      <div className="p-5">
        <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
          {packageItem.category?.name ?? "Studio"}
        </p>
        <h3
          className="mt-2 text-xl font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Link href={`/goi-chup/${packageItem.slug}`}>{packageItem.name}</Link>
        </h3>
        {packageItem.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
            {packageItem.description}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <p className="text-lg font-semibold">
            {currencyFormatter.format(packageItem.salePrice ?? packageItem.price)}
          </p>
          {packageItem.salePrice !== null ? (
            <p className="text-sm text-zinc-500 line-through">
              {currencyFormatter.format(packageItem.price)}
            </p>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/goi-chup/${packageItem.slug}`}
            className="theme-button-secondary"
          >
            Xem chi ti\u1ebft
          </Link>
          <Link
            href={`/dat-lich?package=${packageItem.slug}`}
            className="theme-button-primary"
          >
            \u0110\u1eb7t l\u1ecbch
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HomeAlbumCardView({ album }: { album: HomeAlbumCard }) {
  return (
    <article className="theme-card overflow-hidden">
      <Link
        href={`/album/${album.slug}`}
        className="relative block aspect-[4/3] bg-zinc-100"
      >
        {album.cover ? (
          <Image
            src={getMediaAssetUrl(album.cover.url)}
            alt={album.cover.alt || album.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-zinc-500">
            Album
          </span>
        )}
      </Link>
      <div className="p-5">
        <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
          {album.category?.name ?? album.location}
        </p>
        <h3
          className="mt-2 text-xl font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Link href={`/album/${album.slug}`}>{album.title}</Link>
        </h3>
        {album.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
            {album.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function HomePostCardView({ post }: { post: HomePostCard }) {
  return (
    <article className="theme-card overflow-hidden">
      <Link
        href={`/tin-tuc/${post.slug}`}
        className="relative block aspect-[16/10] bg-zinc-100"
      >
        {post.cover ? (
          <Image
            src={getMediaAssetUrl(post.cover.url)}
            alt={post.cover.alt || post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-zinc-500">
            News
          </span>
        )}
      </Link>
      <div className="p-5">
        <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
          {post.category?.name ?? "Tin t\u1ee9c"}
        </p>
        <h3
          className="mt-2 text-xl font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Link href={`/tin-tuc/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.publishedAt ? (
          <p className="mt-2 text-xs font-semibold text-zinc-500">
            {dateFormatter.format(new Date(post.publishedAt))}
          </p>
        ) : null}
        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
            {post.excerpt}
          </p>
        ) : null}
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
    <article className="theme-card overflow-hidden">
      <Link
        href={`/dia-diem/${location.slug}`}
        className="relative block aspect-[4/3] bg-zinc-100"
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
          <span className="flex h-full items-center justify-center text-sm text-zinc-500">
            Location
          </span>
        )}
      </Link>
      <div className="p-5">
        <h3
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Link href={`/dia-diem/${location.slug}`}>{location.name}</Link>
        </h3>
        {location.address ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">
            {location.address}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/dia-diem/${location.slug}`}
            className="theme-button-secondary"
          >
            Xem chi ti\u1ebft
          </Link>
          <Link
            href={`/dat-lich?location=${location.slug}`}
            className="theme-button-primary"
          >
            \u0110\u1eb7t l\u1ecbch
          </Link>
        </div>
      </div>
    </article>
  );
}
