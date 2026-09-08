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
import {
  emptyLabel,
  getAdminErrorMessage,
  publishStatusLabels,
  saveErrorMessage,
} from "@/lib/admin-labels";
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
      setError("Vui lòng tạo và chọn danh mục bài viết trước.");
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
        setNotice("Đã cập nhật bài viết.");
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
      setError(getAdminErrorMessage(caughtError, saveErrorMessage));
    } finally {
      setIsSubmitting(false);
    }
  }

  function buildPayload(): PostInput | null {
    const parsedSortOrder = sortOrder.trim() ? Number(sortOrder) : 0;

    if (!Number.isInteger(parsedSortOrder)) {
      setError("Thứ tự phải là số nguyên.");
      return null;
    }

    if (tags.length > MAX_TAGS) {
      setError(`Có thể thêm tối đa ${MAX_TAGS} thẻ.`);
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
      setError("Mỗi thẻ có thể dài tối đa 50 ký tự.");
      return;
    }

    if (tags.length >= MAX_TAGS) {
      setError(`Có thể thêm tối đa ${MAX_TAGS} thẻ.`);
      return;
    }

    if (normalizedTagSet.has(nextTag.toLowerCase())) {
      setError("Thẻ không được trùng nhau.");
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
        <h2 className="text-lg font-semibold">Thông tin cơ bản</h2>
        <div className="space-y-5">
          <label className="block text-sm font-medium text-zinc-700">
            Tiêu đề
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={220}
              required
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Đường dẫn
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="Để trống để hệ thống tự tạo từ tiêu đề"
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <span className="mt-2 block text-xs font-normal text-zinc-500">
              Đường dẫn dùng trên website, ví dụ: bi-quyet-chup-anh-cuoi.
            </span>
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Danh mục
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
        <h2 className="text-lg font-semibold">Ảnh và tóm tắt</h2>
        <div className="space-y-6">
          <MediaBlock title="Ảnh bìa" items={cover} onClear={setCover} />
          <MediaPicker
            title="Chọn ảnh bìa"
            mode="single"
            selected={cover}
            onChange={setCover}
          />

          <label className="block text-sm font-medium text-zinc-700">
            Tóm tắt
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
        <h2 className="text-lg font-semibold">Nội dung</h2>
        <div>
          <RichTextEditor value={contentHtml} onChange={setContentHtml} />
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Thẻ</h2>
        <div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={handleTagKeyDown}
              maxLength={50}
              aria-label="Thẻ"
              placeholder="Nhập thẻ"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-zinc-50"
            >
              Thêm
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
                  Gỡ bỏ
                </button>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Hiển thị</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700">
            Trạng thái
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as PostStatus)}
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {publishStatusLabels[item]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Ngày đăng
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Thứ tự
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
            Nổi bật
          </label>
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">SEO</h2>
        <div className="space-y-5">
          <label className="block text-sm font-medium text-zinc-700">
            Tiêu đề SEO
            <input
              value={seoTitle}
              onChange={(event) => setSeoTitle(event.target.value)}
              maxLength={70}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Mô tả SEO
            <textarea
              value={seoDescription}
              onChange={(event) => setSeoDescription(event.target.value)}
              maxLength={180}
              rows={3}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <MediaBlock
            title="Ảnh chia sẻ"
            items={seoImage}
            onClear={setSeoImage}
          />
          <MediaPicker
            title="Chọn ảnh chia sẻ"
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
          Hủy
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "Đang lưu..." : "Lưu bài viết"}
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
            Gỡ bỏ
          </button>
        </div>
      ) : (
        <p className="rounded-md border border-zinc-200 bg-white px-3 py-4 text-sm text-zinc-500">
          {emptyLabel}
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
