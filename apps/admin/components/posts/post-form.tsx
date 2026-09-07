"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type KeyboardEvent, useMemo, useState } from "react";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { MediaPicker, type MediaChoice } from "@/components/media/media-picker";
import { getMediaAssetUrl } from "@/lib/api/media";
import type { PostCategory } from "@/lib/api/post-categories";
import {
  type AdminPost,
  type PostInput,
  type PostStatus,
  createPost,
  updatePost,
} from "@/lib/api/posts";
import { withAuthRefresh } from "@/lib/api/session";

interface PostFormProps {
  categories: PostCategory[];
  initialPost?: AdminPost;
}

const statuses: PostStatus[] = ["draft", "published", "hidden"];
const MAX_TAGS = 20;

export function PostForm({ categories, initialPost }: PostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [categoryId, setCategoryId] = useState(
    initialPost?.categoryId ?? categories[0]?.id ?? "",
  );
  const [cover, setCover] = useState<MediaChoice[]>(
    initialPost?.cover ? [initialPost.cover] : [],
  );
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [contentHtml, setContentHtml] = useState(
    initialPost?.contentHtml ?? "",
  );
  const [tags, setTags] = useState<string[]>(initialPost?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [status, setStatus] = useState<PostStatus>(
    initialPost?.status ?? "draft",
  );
  const [publishedAt, setPublishedAt] = useState(
    formatDateTimeInput(initialPost?.publishedAt),
  );
  const [isFeatured, setIsFeatured] = useState(
    initialPost?.isFeatured ?? false,
  );
  const [sortOrder, setSortOrder] = useState(
    String(initialPost?.sortOrder ?? 0),
  );
  const [seoTitle, setSeoTitle] = useState(initialPost?.seo.title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialPost?.seo.description ?? "",
  );
  const [seoImage, setSeoImage] = useState<MediaChoice[]>(
    initialPost?.seo.ogImage ? [initialPost.seo.ogImage] : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedTagSet = useMemo(
    () => new Set(tags.map((tag) => tag.toLowerCase())),
    [tags],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!categoryId) {
      setError("Please create and choose a post category first.");
      return;
    }

    const payload = buildPayload();

    if (!payload) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialPost) {
        await withAuthRefresh(
          () => updatePost(initialPost.id, payload),
          () => router.replace("/login"),
        );
        setNotice("Post saved.");
        router.refresh();
      } else {
        const response = await withAuthRefresh(
          () => createPost(payload),
          () => router.replace("/login"),
        );

        if (response) {
          router.push(`/dashboard/posts/${response.data.id}/edit`);
        }
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to save post."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function buildPayload(): PostInput | null {
    const parsedSortOrder = sortOrder.trim() ? Number(sortOrder) : 0;

    if (!Number.isInteger(parsedSortOrder)) {
      setError("Sort order must be an integer.");
      return null;
    }

    if (tags.length > MAX_TAGS) {
      setError(`Tags can contain up to ${MAX_TAGS} items.`);
      return null;
    }

    return {
      title,
      slug: slug.trim() || undefined,
      categoryId,
      coverMediaId: cover[0]?.id ?? null,
      excerpt,
      contentHtml,
      tags,
      status,
      isFeatured,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
      sortOrder: parsedSortOrder,
      seo: {
        title: seoTitle,
        description: seoDescription,
        ogImageMediaId: seoImage[0]?.id ?? null,
      },
    };
  }

  function addTag() {
    const nextTag = tagDraft.trim();

    if (!nextTag) {
      setTagDraft("");
      return;
    }

    if (nextTag.length > 50) {
      setError("Each tag can contain up to 50 characters.");
      return;
    }

    if (tags.length >= MAX_TAGS) {
      setError(`Tags can contain up to ${MAX_TAGS} items.`);
      return;
    }

    if (normalizedTagSet.has(nextTag.toLowerCase())) {
      setError("Tags must be unique.");
      return;
    }

    setTags((items) => [...items, nextTag]);
    setTagDraft("");
    setError(null);
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addTag();
  }

  function removeTag(tagToRemove: string) {
    setTags((items) => items.filter((tag) => tag !== tagToRemove));
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
              maxLength={220}
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
        <h2 className="text-lg font-semibold">Preview</h2>
        <div className="space-y-6">
          <MediaBlock title="Cover" items={cover} onClear={setCover} />
          <MediaPicker
            title="Choose cover"
            mode="single"
            selected={cover}
            onChange={setCover}
          />

          <label className="block text-sm font-medium text-zinc-700">
            Excerpt
            <textarea
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              maxLength={500}
              rows={4}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Content</h2>
        <div>
          <RichTextEditor value={contentHtml} onChange={setContentHtml} />
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Tags</h2>
        <div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={handleTagKeyDown}
              maxLength={50}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-zinc-50"
            >
              Add
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-xs font-semibold text-red-700"
                >
                  Remove
                </button>
              </span>
            ))}
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
              onChange={(event) => setStatus(event.target.value as PostStatus)}
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
            Published At
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
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
          href="/dashboard/posts"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "Saving..." : "Save Post"}
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

function formatDateTimeInput(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
