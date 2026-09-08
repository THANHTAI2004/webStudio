"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { MediaPicker, type MediaChoice } from "@/components/media/media-picker";
import {
  type AdminLocation,
  createLocation,
  type LocationInput,
  type LocationOpeningHour,
  type LocationWeekday,
  updateLocation,
} from "@/lib/api/locations";
import { getMediaAssetUrl } from "@/lib/api/media";
import {
  emptyLabel,
  getAdminErrorMessage,
  saveErrorMessage,
} from "@/lib/admin-labels";
import { withAuthRefresh } from "@/lib/api/session";

interface LocationFormProps {
  initialLocation?: AdminLocation;
}

const weekdays: LocationWeekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const weekdayLabels: Record<LocationWeekday, string> = {
  monday: "Th\u1ee9 Hai",
  tuesday: "Th\u1ee9 Ba",
  wednesday: "Th\u1ee9 T\u01b0",
  thursday: "Th\u1ee9 N\u0103m",
  friday: "Th\u1ee9 S\u00e1u",
  saturday: "Th\u1ee9 B\u1ea3y",
  sunday: "Ch\u1ee7 Nh\u1eadt",
};

export function LocationForm({ initialLocation }: LocationFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialLocation?.name ?? "");
  const [slug, setSlug] = useState(initialLocation?.slug ?? "");
  const [description, setDescription] = useState(
    initialLocation?.description ?? "",
  );
  const [address, setAddress] = useState(initialLocation?.address ?? "");
  const [phone, setPhone] = useState(initialLocation?.phone ?? "");
  const [email, setEmail] = useState(initialLocation?.email ?? "");
  const [mapUrl, setMapUrl] = useState(initialLocation?.mapUrl ?? "");
  const [latitude, setLatitude] = useState(
    initialLocation?.coordinates.latitude === null ||
      initialLocation?.coordinates.latitude === undefined
      ? ""
      : String(initialLocation.coordinates.latitude),
  );
  const [longitude, setLongitude] = useState(
    initialLocation?.coordinates.longitude === null ||
      initialLocation?.coordinates.longitude === undefined
      ? ""
      : String(initialLocation.coordinates.longitude),
  );
  const [cover, setCover] = useState<MediaChoice[]>(
    initialLocation?.cover ? [initialLocation.cover] : [],
  );
  const [gallery, setGallery] = useState<MediaChoice[]>(
    initialLocation?.gallery ?? [],
  );
  const [openingHours, setOpeningHours] = useState<LocationOpeningHour[]>(
    normalizeOpeningHours(initialLocation?.openingHours),
  );
  const [isActive, setIsActive] = useState(initialLocation?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(
    initialLocation?.isFeatured ?? false,
  );
  const [sortOrder, setSortOrder] = useState(
    String(initialLocation?.sortOrder ?? 0),
  );
  const [seoTitle, setSeoTitle] = useState(initialLocation?.seo.title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialLocation?.seo.description ?? "",
  );
  const [seoImage, setSeoImage] = useState<MediaChoice[]>(
    initialLocation?.seo.ogImage ? [initialLocation.seo.ogImage] : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const payload = buildPayload();

    if (!payload) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialLocation) {
        await withAuthRefresh(
          () => updateLocation(initialLocation.id, payload),
          () => router.replace("/login"),
        );
        setNotice("Đã cập nhật cơ sở.");
        router.refresh();
      } else {
        const response = await withAuthRefresh(
          () => createLocation(payload),
          () => router.replace("/login"),
        );

        if (response) {
          router.push(`/dashboard/locations/${response.data.id}/edit`);
        }
      }
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, saveErrorMessage));
    } finally {
      setIsSubmitting(false);
    }
  }

  function buildPayload(): LocationInput | null {
    const parsedLatitude = latitude.trim() ? Number(latitude) : null;
    const parsedLongitude = longitude.trim() ? Number(longitude) : null;
    const parsedSortOrder = sortOrder.trim() ? Number(sortOrder) : 0;

    if (name.trim().length === 0) {
      setError("Vui lòng nhập tên cơ sở.");
      return null;
    }

    if (address.trim().length === 0) {
      setError("Vui lòng nhập địa chỉ.");
      return null;
    }

    if (phone.trim().length === 0) {
      setError("Vui lòng nhập số điện thoại.");
      return null;
    }

    if (
      parsedLatitude !== null &&
      (!Number.isFinite(parsedLatitude) ||
        parsedLatitude < -90 ||
        parsedLatitude > 90)
    ) {
      setError("Vĩ độ phải nằm trong khoảng -90 đến 90.");
      return null;
    }

    if (
      parsedLongitude !== null &&
      (!Number.isFinite(parsedLongitude) ||
        parsedLongitude < -180 ||
        parsedLongitude > 180)
    ) {
      setError("Kinh độ phải nằm trong khoảng -180 đến 180.");
      return null;
    }

    if (!Number.isInteger(parsedSortOrder)) {
      setError("Thứ tự phải là số nguyên.");
      return null;
    }

    for (const item of openingHours) {
      if (!item.isClosed && (!item.openTime || !item.closeTime)) {
        setError(
          `${weekdayLabels[item.day]} cần có giờ mở cửa và giờ đóng cửa.`,
        );
        return null;
      }
    }

    return {
      name,
      slug: slug.trim() || undefined,
      description,
      address,
      phone,
      email: email.trim() || null,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      mapUrl: mapUrl.trim() || null,
      coverMediaId: cover[0]?.id ?? null,
      galleryMediaIds: gallery.map((item) => item.id),
      openingHours: openingHours.map((item) => ({
        day: item.day,
        isClosed: item.isClosed,
        openTime: item.isClosed ? null : item.openTime,
        closeTime: item.isClosed ? null : item.closeTime,
      })),
      isActive,
      isFeatured,
      sortOrder: parsedSortOrder,
      seo: {
        title: seoTitle,
        description: seoDescription,
        ogImageMediaId: seoImage[0]?.id ?? null,
      },
    };
  }

  function updateOpeningHour(
    day: LocationWeekday,
    patch: Partial<LocationOpeningHour>,
  ) {
    setOpeningHours((items) =>
      items.map((item) => {
        if (item.day !== day) {
          return item;
        }

        const nextItem = {
          ...item,
          ...patch,
        };

        return nextItem.isClosed
          ? {
              ...nextItem,
              openTime: null,
              closeTime: null,
            }
          : nextItem;
      }),
    );
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
        <h2 className="text-lg font-semibold">Thông tin cơ bản</h2>
        <div className="space-y-5">
          <TextField
            label="Tên"
            value={name}
            onChange={setName}
            maxLength={160}
            required
          />
          <TextField
            label="Đường dẫn"
            value={slug}
            onChange={setSlug}
            placeholder="Để trống để hệ thống tự tạo từ tên"
            helper="Đường dẫn dùng trên website, ví dụ: studio-quan-1."
          />
          <label className="block text-sm font-medium text-zinc-700">
            Mô tả
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={3000}
              rows={5}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Thông tin liên hệ</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Địa chỉ"
            value={address}
            onChange={setAddress}
            maxLength={500}
            required
          />
          <TextField
            label="Số điện thoại"
            value={phone}
            onChange={setPhone}
            maxLength={50}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
          />
          <TextField
            label="Đường dẫn bản đồ"
            type="url"
            value={mapUrl}
            onChange={setMapUrl}
            maxLength={1000}
          />
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Tọa độ</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Vĩ độ"
            type="number"
            value={latitude}
            onChange={setLatitude}
            min={-90}
            max={90}
            step="any"
          />
          <TextField
            label="Kinh độ"
            type="number"
            value={longitude}
            onChange={setLongitude}
            min={-180}
            max={180}
            step="any"
          />
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Hình ảnh</h2>
        <div className="space-y-6">
          <MediaBlock title="Ảnh bìa" items={cover} onClear={setCover} />
          <MediaPicker
            title="Chọn ảnh bìa"
            mode="single"
            selected={cover}
            onChange={setCover}
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
                maxSelection={30}
                maxSelectionMessage="Bộ sưu tập có thể có tối đa 30 ảnh."
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
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {item.originalName || item.alt || item.id}
                    </p>
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(index, -1)}
                      disabled={index === 0}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
                    >
                      Sang trái
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(index, 1)}
                      disabled={index === gallery.length - 1}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
                    >
                      Sang phải
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
        <h2 className="text-lg font-semibold">Giờ làm việc</h2>
        <div className="space-y-3">
          {openingHours.map((item) => (
            <div
              key={item.day}
              className="grid gap-3 rounded-md border border-zinc-200 bg-white p-3 sm:grid-cols-[110px_120px_1fr_1fr]"
            >
              <p className="text-sm font-semibold text-zinc-700">
                {weekdayLabels[item.day]}
              </p>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={item.isClosed}
                  onChange={(event) =>
                    updateOpeningHour(item.day, {
                      isClosed: event.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
                />
                {"\u0110\u00f3ng c\u1eeda"}
              </label>
              <input
                type="time"
                value={item.openTime ?? ""}
                disabled={item.isClosed}
                onChange={(event) =>
                  updateOpeningHour(item.day, {
                    openTime: event.target.value || null,
                  })
                }
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
              />
              <input
                type="time"
                value={item.closeTime ?? ""}
                disabled={item.isClosed}
                onChange={(event) =>
                  updateOpeningHour(item.day, {
                    closeTime: event.target.value || null,
                  })
                }
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">Hiển thị</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex items-center gap-3 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
            />
            Hiển thị
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
          <TextField
            label="Thứ tự"
            type="number"
            value={sortOrder}
            onChange={setSortOrder}
          />
        </div>
      </section>

      <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
        <h2 className="text-lg font-semibold">SEO</h2>
        <div className="space-y-5">
          <TextField
            label="Tiêu đề SEO"
            value={seoTitle}
            onChange={setSeoTitle}
            maxLength={70}
          />
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
          href="/dashboard/locations"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
        >
          Hủy
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "Đang lưu..." : "Lưu cơ sở"}
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
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">
            {items[0].originalName || items[0].alt || items[0].id}
          </p>
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

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  max,
  step,
  maxLength,
  placeholder,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  maxLength?: number;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
      {helper ? (
        <span className="mt-2 block text-xs font-normal text-zinc-500">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function normalizeOpeningHours(
  initialOpeningHours: LocationOpeningHour[] | undefined,
): LocationOpeningHour[] {
  const byDay = new Map(
    (initialOpeningHours ?? []).map((item) => [item.day, item]),
  );

  return weekdays.map(
    (day) =>
      byDay.get(day) ?? {
        day,
        isClosed: false,
        openTime: "08:00",
        closeTime: "18:00",
      },
  );
}
