"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  type AdminPackage,
  createPackage,
  type PackageInput,
  type PackageStatus,
  updatePackage,
} from "@/lib/api/packages";
import type { PackageCategory } from "@/lib/api/package-categories";
import { getMediaAssetUrl } from "@/lib/api/media";
import { MediaPicker, type MediaChoice } from "@/components/media/media-picker";
import {
  emptyLabel,
  getAdminErrorMessage,
  publishStatusLabels,
  saveErrorMessage,
} from "@/lib/admin-labels";
import { withAuthRefresh } from "@/lib/api/session";

interface PackageFormProps {
  categories: PackageCategory[];
  initialPackage?: AdminPackage;
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const statuses: PackageStatus[] = ["draft", "published", "hidden"];

export function PackageForm({ categories, initialPackage }: PackageFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialPackage?.name ?? "");
  const [slug, setSlug] = useState(initialPackage?.slug ?? "");
  const [categoryId, setCategoryId] = useState(
    initialPackage?.categoryId ?? categories[0]?.id ?? "",
  );
  const [price, setPrice] = useState(String(initialPackage?.price ?? 0));
  const [salePrice, setSalePrice] = useState(
    initialPackage?.salePrice === null ||
      initialPackage?.salePrice === undefined
      ? ""
      : String(initialPackage.salePrice),
  );
  const [durationMinutes, setDurationMinutes] = useState(
    initialPackage?.durationMinutes === null ||
      initialPackage?.durationMinutes === undefined
      ? ""
      : String(initialPackage.durationMinutes),
  );
  const [featuresText, setFeaturesText] = useState(
    initialPackage?.features.join("\n") ?? "",
  );
  const [description, setDescription] = useState(
    initialPackage?.description ?? "",
  );
  const [content, setContent] = useState(initialPackage?.content ?? "");
  const [status, setStatus] = useState<PackageStatus>(
    initialPackage?.status ?? "draft",
  );
  const [isFeatured, setIsFeatured] = useState(
    initialPackage?.isFeatured ?? false,
  );
  const [sortOrder, setSortOrder] = useState(
    String(initialPackage?.sortOrder ?? 0),
  );
  const [seoTitle, setSeoTitle] = useState(initialPackage?.seo.title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialPackage?.seo.description ?? "",
  );
  const [thumbnail, setThumbnail] = useState<MediaChoice[]>(
    initialPackage?.thumbnail ? [initialPackage.thumbnail] : [],
  );
  const [gallery, setGallery] = useState<MediaChoice[]>(
    initialPackage?.gallery ?? [],
  );
  const [seoImage, setSeoImage] = useState<MediaChoice[]>(
    initialPackage?.seo.ogImage ? [initialPackage.seo.ogImage] : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!categoryId) {
      setError("Vui lòng tạo và chọn danh mục trước.");
      return;
    }

    const payload = buildPayload();

    if (!payload) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialPackage) {
        await withAuthRefresh(
          () => updatePackage(initialPackage.id, payload),
          () => router.replace("/login"),
        );
        setNotice("Đã cập nhật gói chụp.");
        router.refresh();
      } else {
        const response = await withAuthRefresh(
          () => createPackage(payload),
          () => router.replace("/login"),
        );

        if (response) {
          router.push(`/dashboard/packages/${response.data.id}/edit`);
        }
      }
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, saveErrorMessage));
    } finally {
      setIsSubmitting(false);
    }
  }

  function buildPayload(): PackageInput | null {
    const parsedPrice = Number(price);
    const parsedSalePrice = salePrice.trim() ? Number(salePrice) : null;
    const parsedDuration = durationMinutes.trim()
      ? Number(durationMinutes)
      : null;
    const parsedSortOrder = sortOrder.trim() ? Number(sortOrder) : 0;

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Giá phải từ 0 trở lên.");
      return null;
    }

    if (
      parsedSalePrice !== null &&
      (!Number.isFinite(parsedSalePrice) || parsedSalePrice < 0)
    ) {
      setError("Giá khuyến mãi phải từ 0 trở lên.");
      return null;
    }

    if (
      parsedDuration !== null &&
      (!Number.isFinite(parsedDuration) || parsedDuration < 1)
    ) {
      setError("Thời lượng phải ít nhất 1 phút.");
      return null;
    }

    if (!Number.isInteger(parsedSortOrder)) {
      setError("Thứ tự phải là số nguyên.");
      return null;
    }

    const features = featuresText
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

    return {
      name,
      slug: slug.trim() || undefined,
      categoryId,
      thumbnailMediaId: thumbnail[0]?.id ?? null,
      galleryMediaIds: gallery.map((item) => item.id),
      price: parsedPrice,
      salePrice: parsedSalePrice,
      durationMinutes: parsedDuration,
      features,
      description,
      content,
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

  const previewPrice = Number(price);

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
            Tên
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={200}
              required
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Đường dẫn
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="Để trống để hệ thống tự tạo từ tên"
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <span className="mt-2 block text-xs font-normal text-zinc-500">
              Đường dẫn dùng trên website, ví dụ: goi-chup-anh-cuoi.
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
        <h2 className="text-lg font-semibold">Giá</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700">
            Giá
            <input
              type="number"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Giá khuyến mãi
            <input
              type="number"
              min="0"
              value={salePrice}
              onChange={(event) => setSalePrice(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Thời lượng (phút)
            <input
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <p className="self-end text-sm font-semibold text-zinc-700">
            {Number.isFinite(previewPrice)
              ? currencyFormatter.format(previewPrice)
              : currencyFormatter.format(0)}
          </p>
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Hình ảnh</h2>
        <div className="space-y-6">
          <MediaBlock
            title="Ảnh đại diện"
            items={thumbnail}
            onClear={setThumbnail}
          />
          <MediaPicker
            title="Chọn ảnh đại diện"
            mode="single"
            selected={thumbnail}
            onChange={setThumbnail}
          />

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-700">
                Bộ sưu tập ảnh
              </h3>
              <MediaPicker
                title="Chọn ảnh"
                mode="multiple"
                selected={gallery}
                onChange={setGallery}
              />
            </div>
            {gallery.length === 0 ? (
              <p className="rounded-md border border-zinc-200 bg-white px-3 py-4 text-sm text-zinc-500">
                Chưa chọn ảnh nào.
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
                      Di chuyển lên
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(index, 1)}
                      disabled={index === gallery.length - 1}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
                    >
                      Di chuyển xuống
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
                      Gỡ bỏ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Nội dung</h2>
        <div className="space-y-5">
          <label className="block text-sm font-medium text-zinc-700">
            Nội dung gói
            <textarea
              value={featuresText}
              onChange={(event) => setFeaturesText(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Mô tả
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Nội dung
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={8}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Hiển thị</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-700">
            Trạng thái
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as PackageStatus)
              }
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
          href="/dashboard/packages"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
        >
          Hủy
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "Đang lưu..." : "Lưu gói chụp"}
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
