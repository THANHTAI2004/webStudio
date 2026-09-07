"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { MediaPicker, type MediaChoice } from "@/components/media/media-picker";
import { getMediaAssetUrl } from "@/lib/api/media";
import type { AlbumCategory } from "@/lib/api/album-categories";
import {
  type AdminAlbum,
  type AlbumInput,
  type AlbumStatus,
  createAlbum,
  updateAlbum,
} from "@/lib/api/albums";
import { withAuthRefresh } from "@/lib/api/session";

interface AlbumFormProps {
  categories: AlbumCategory[];
  initialAlbum?: AdminAlbum;
}

const statuses: AlbumStatus[] = ["draft", "published", "hidden"];
const MAX_GALLERY_IMAGES = 200;

export function AlbumForm({ categories, initialAlbum }: AlbumFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialAlbum?.title ?? "");
  const [slug, setSlug] = useState(initialAlbum?.slug ?? "");
  const [categoryId, setCategoryId] = useState(
    initialAlbum?.categoryId ?? categories[0]?.id ?? "",
  );
  const [description, setDescription] = useState(
    initialAlbum?.description ?? "",
  );
  const [content, setContent] = useState(initialAlbum?.content ?? "");
  const [shootingDate, setShootingDate] = useState(
    formatDateInput(initialAlbum?.shootingDate),
  );
  const [location, setLocation] = useState(initialAlbum?.location ?? "");
  const [status, setStatus] = useState<AlbumStatus>(
    initialAlbum?.status ?? "draft",
  );
  const [isFeatured, setIsFeatured] = useState(
    initialAlbum?.isFeatured ?? false,
  );
  const [sortOrder, setSortOrder] = useState(
    String(initialAlbum?.sortOrder ?? 0),
  );
  const [seoTitle, setSeoTitle] = useState(initialAlbum?.seo.title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialAlbum?.seo.description ?? "",
  );
  const [cover, setCover] = useState<MediaChoice[]>(
    initialAlbum?.cover ? [initialAlbum.cover] : [],
  );
  const [gallery, setGallery] = useState<MediaChoice[]>(
    initialAlbum?.gallery ?? [],
  );
  const [seoImage, setSeoImage] = useState<MediaChoice[]>(
    initialAlbum?.seo.ogImage ? [initialAlbum.seo.ogImage] : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!categoryId) {
      setError("Please create and choose an album category first.");
      return;
    }

    const payload = buildPayload();

    if (!payload) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialAlbum) {
        await withAuthRefresh(
          () => updateAlbum(initialAlbum.id, payload),
          () => router.replace("/login"),
        );
        setNotice("Album saved.");
        router.refresh();
      } else {
        const response = await withAuthRefresh(
          () => createAlbum(payload),
          () => router.replace("/login"),
        );

        if (response) {
          router.push(`/dashboard/albums/${response.data.id}/edit`);
        }
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to save album."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function buildPayload(): AlbumInput | null {
    const parsedSortOrder = sortOrder.trim() ? Number(sortOrder) : 0;

    if (!Number.isInteger(parsedSortOrder)) {
      setError("Sort order must be an integer.");
      return null;
    }

    if (gallery.length > MAX_GALLERY_IMAGES) {
      setError(`Gallery can contain up to ${MAX_GALLERY_IMAGES} images.`);
      return null;
    }

    const galleryIds = gallery.map((item) => item.id);

    if (new Set(galleryIds).size !== galleryIds.length) {
      setError("Gallery cannot contain duplicate images.");
      return null;
    }

    return {
      title,
      slug: slug.trim() || undefined,
      categoryId,
      coverMediaId: cover[0]?.id ?? null,
      galleryMediaIds: galleryIds,
      description,
      content,
      shootingDate: shootingDate || null,
      location,
      status,
      isFeatured,
      sortOrder: parsedSortOrder,
      seo: {
        title: seoTitle,
        description: seoDescription,
        ogImageMediaId: seoImage[0]?.id ?? null,
      },
    };
  }

  function moveGalleryItem(index: number, direction: -1 | 1) {
    setGallery((items) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= items.length) {
        return items;
      }

      const nextItems = [...items];
      const [item] = nextItems.splice(index, 1);

      nextItems.splice(nextIndex, 0, item);

      return nextItems;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Basic</h2>
        <div className="space-y-5">
          <label className="block text-sm font-medium text-zinc-700">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              required
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Slug
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="Leave empty to generate from title"
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Category
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Information</h2>
        <div className="space-y-5">
          <label className="block text-sm font-medium text-zinc-700">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={4}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Content
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={20000}
              rows={8}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-zinc-700">
              Shooting Date
              <input
                type="date"
                value={shootingDate}
                onChange={(event) => setShootingDate(event.target.value)}
                className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700">
              Location
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                maxLength={250}
                className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Media</h2>
        <div className="space-y-6">
          <MediaBlock title="Cover" items={cover} onClear={setCover} />
          <MediaPicker
            title="Choose cover"
            mode="single"
            selected={cover}
            onChange={setCover}
          />

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-700">
                Gallery ({gallery.length}/{MAX_GALLERY_IMAGES})
              </h3>
              <MediaPicker
                title="Choose gallery"
                mode="multiple"
                selected={gallery}
                onChange={setGallery}
                maxSelection={MAX_GALLERY_IMAGES}
                maxSelectionMessage={`Gallery can contain up to ${MAX_GALLERY_IMAGES} images.`}
              />
            </div>
            {gallery.length === 0 ? (
              <p className="rounded-md border border-zinc-200 bg-white px-3 py-4 text-sm text-zinc-500">
                No gallery images selected.
              </p>
            ) : (
              <div className="space-y-3">
                {gallery.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-2"
                  >
                    <MediaThumb item={item} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {item.originalName || item.alt || item.id}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(index, -1)}
                      disabled={index === 0}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
                    >
                      Move Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(index, 1)}
                      disabled={index === gallery.length - 1}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
                    >
                      Move Down
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setGallery((items) =>
                          items.filter((entry) => entry.id !== item.id),
                        )
                      }
                      className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Publishing</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as AlbumStatus)}
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Sort Order
            <input
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(event) => setIsFeatured(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
            />
            Featured
          </label>
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">SEO</h2>
        <div className="space-y-5">
          <label className="block text-sm font-medium text-zinc-700">
            SEO Title
            <input
              value={seoTitle}
              onChange={(event) => setSeoTitle(event.target.value)}
              maxLength={70}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            SEO Description
            <textarea
              value={seoDescription}
              onChange={(event) => setSeoDescription(event.target.value)}
              maxLength={180}
              rows={3}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <MediaBlock title="OG Image" items={seoImage} onClear={setSeoImage} />
          <MediaPicker
            title="Choose OG image"
            mode="single"
            selected={seoImage}
            onChange={setSeoImage}
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/dashboard/albums"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "Saving..." : "Save Album"}
        </button>
      </div>
    </form>
  );
}

function MediaBlock({
  title,
  items,
  onClear,
}: {
  title: string;
  items: MediaChoice[];
  onClear: (items: MediaChoice[]) => void;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">{title}</h3>
      {items[0] ? (
        <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-2">
          <MediaThumb item={items[0]} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {items[0].originalName || items[0].alt || items[0].id}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClear([])}
            className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <p className="rounded-md border border-zinc-200 bg-white px-3 py-4 text-sm text-zinc-500">
          No image selected.
        </p>
      )}
    </div>
  );
}

function MediaThumb({ item }: { item: MediaChoice }) {
  return (
    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100">
      <Image
        src={getMediaAssetUrl(item.url)}
        alt={item.alt || item.originalName || ""}
        fill
        sizes="80px"
        className="object-cover"
      />
    </div>
  );
}

function formatDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
