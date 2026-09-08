"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  BookingApiError,
  createBooking,
  type PublicBooking,
} from "@/lib/api/bookings";
import { getMediaAssetUrl } from "@/lib/api/client";
import type { PublicLocationListItem } from "@/lib/api/locations";
import type { PublicPackageListItem } from "@/lib/api/packages";
import { formatBookingLocation } from "@/lib/location-format";

interface BookingFormProps {
  packages: PublicPackageListItem[];
  locations: PublicLocationListItem[];
  preselectedPackageSlug?: string;
  preselectedLocationSlug?: string;
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export function BookingForm({
  packages,
  locations,
  preselectedPackageSlug,
  preselectedLocationSlug,
}: BookingFormProps) {
  const preselectedPackage = packages.find(
    (item) => item.slug === preselectedPackageSlug,
  );
  const preselectedLocation = locations.find(
    (item) => item.slug === preselectedLocationSlug,
  );
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [packageId, setPackageId] = useState(
    preselectedPackage?.id ?? packages[0]?.id ?? "",
  );
  const [shootDate, setShootDate] = useState("");
  const [shootTime, setShootTime] = useState("");
  const [peopleCount, setPeopleCount] = useState("2");
  const [selectedLocationId, setSelectedLocationId] = useState(
    preselectedLocation?.id ?? "custom",
  );
  const [location, setLocation] = useState(
    preselectedLocation ? formatBookingLocation(preselectedLocation) : "",
  );
  const [customerNote, setCustomerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<PublicBooking | null>(null);

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === packageId) ?? null,
    [packageId, packages],
  );
  const today = useMemo(() => getTodayInputValue(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setConfirmation(null);

    const parsedPeopleCount = Number(peopleCount);

    if (!selectedPackage) {
      setError("Vui lòng chọn gói chụp.");
      return;
    }

    if (
      !Number.isInteger(parsedPeopleCount) ||
      parsedPeopleCount < 1 ||
      parsedPeopleCount > 50
    ) {
      setError("Số người phải từ 1 đến 50.");
      return;
    }

    setIsSubmitting(true);

    try {
      const booking = await createBooking({
        customerName,
        phone,
        email: email.trim() || null,
        packageId: selectedPackage.id,
        shootDate,
        shootTime,
        peopleCount: parsedPeopleCount,
        location,
        customerNote,
      });

      setConfirmation(booking);
      setCustomerName("");
      setPhone("");
      setEmail("");
      setShootDate("");
      setShootTime("");
      setPeopleCount("2");
      setLocation(getLocationTextForSelection(selectedLocationId, locations));
      setCustomerNote("");
    } catch (caughtError) {
      setError(getFriendlyErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmation) {
    return <BookingConfirmation booking={confirmation} onReset={() => setConfirmation(null)} />;
  }

  return (
    <section className="public-form-card">
      <p className="section-eyebrow">Thông tin đặt lịch</p>
      <h2
        className="mt-3 text-3xl font-semibold leading-tight"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Cho Studio biết bạn cần gì
      </h2>

      {error ? (
        <p className="form-message form-message--error mt-5">{error}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-7 space-y-8">
        <FormSection title="1. Chọn gói chụp">
          <label className="form-label">
            Gói chụp <RequiredMark />
            <select
              value={packageId}
              onChange={(event) => setPackageId(event.target.value)}
              disabled={packages.length === 0}
              required
              className="form-select"
            >
              {packages.length === 0 ? (
                <option value="">Chưa có gói chụp</option>
              ) : null}
              {packages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} -{" "}
                  {currencyFormatter.format(item.salePrice ?? item.price)}
                </option>
              ))}
            </select>
          </label>

          {selectedPackage ? (
            <PackagePreview packageItem={selectedPackage} />
          ) : null}
        </FormSection>

        <FormSection title="2. Thời gian">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Ngày chụp"
              type="date"
              value={shootDate}
              onChange={setShootDate}
              min={today}
              required
            />
            <TextField
              label="Giờ"
              type="time"
              value={shootTime}
              onChange={setShootTime}
              required
            />
            <TextField
              label="Số người"
              type="number"
              value={peopleCount}
              onChange={setPeopleCount}
              min={1}
              max={50}
              required
            />
          </div>
        </FormSection>

        <FormSection title="3. Thông tin của bạn">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Họ và tên"
              value={customerName}
              onChange={setCustomerName}
              minLength={2}
              maxLength={120}
              required
            />
            <TextField
              label="Số điện thoại"
              value={phone}
              onChange={setPhone}
              maxLength={40}
              required
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              helper="Không bắt buộc, nhưng giúp Studio gửi lại thông tin tư vấn rõ hơn."
            />
          </div>
        </FormSection>

        <FormSection title="4. Địa điểm và ghi chú">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="form-label">
              Cơ sở Studio
              <select
                value={selectedLocationId}
                onChange={(event) => {
                  const nextLocationId = event.target.value;

                  setSelectedLocationId(nextLocationId);
                  setLocation(getLocationTextForSelection(nextLocationId, locations));
                }}
                className="form-select"
              >
                <option value="custom">Khác / Theo yêu cầu</option>
                {locations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label="Địa điểm mong muốn"
              value={location}
              onChange={setLocation}
              maxLength={300}
              required
            />
          </div>

          <label className="form-label">
            Ghi chú
            <textarea
              value={customerNote}
              onChange={(event) => setCustomerNote(event.target.value)}
              maxLength={2000}
              rows={4}
              className="form-textarea"
            />
            <span className="form-helper">
              Bạn có thể ghi phong cách ảnh, concept, trang phục hoặc yêu cầu
              riêng.
            </span>
          </label>
        </FormSection>

        <button
          type="submit"
          disabled={isSubmitting || packages.length === 0}
          className="theme-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu đặt lịch"}
        </button>
      </form>
    </section>
  );
}

function BookingConfirmation({
  booking,
  onReset,
}: {
  booking: PublicBooking;
  onReset: () => void;
}) {
  return (
    <section className="public-form-card" aria-live="polite">
      <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-xl font-extrabold text-emerald-800">
        ✓
      </div>
      <p className="section-eyebrow mt-6">Đã gửi yêu cầu</p>
      <h2
        className="mt-3 text-3xl font-semibold leading-tight"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Yêu cầu đặt lịch đã được gửi
      </h2>
      <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
        Mã đặt lịch của bạn là{" "}
        <span className="font-extrabold text-[var(--color-text)]">
          {booking.code}
        </span>
        . Studio sẽ liên hệ với bạn để xác nhận lịch.
      </p>
      <dl className="mt-7 grid gap-4 text-sm sm:grid-cols-2">
        <SummaryItem label="Gói chụp" value={booking.package.name} />
        <SummaryItem label="Ngày" value={formatDate(booking.shootDate)} />
        <SummaryItem label="Giờ" value={booking.shootTime} />
        <SummaryItem label="Trạng thái" value="Đã gửi yêu cầu" />
      </dl>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="theme-button-primary">
          Về trang chủ
        </Link>
        <Link href="/goi-chup" className="theme-button-secondary">
          Xem gói chụp
        </Link>
        <button type="button" onClick={onReset} className="theme-button-secondary">
          Gửi yêu cầu khác
        </button>
      </div>
    </section>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="border-t border-[var(--color-border)] pt-6">
      <legend
        className="pr-4 text-xl font-semibold"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </legend>
      <div className="mt-5 grid gap-5">{children}</div>
    </fieldset>
  );
}

function PackagePreview({
  packageItem,
}: {
  packageItem: PublicPackageListItem;
}) {
  return (
    <div className="grid gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-3 sm:grid-cols-[132px_1fr]">
      <div className="image-frame aspect-[4/3]">
        {packageItem.thumbnail ? (
          <Image
            src={getMediaAssetUrl(packageItem.thumbnail.url)}
            alt={packageItem.thumbnail.alt || packageItem.name}
            fill
            sizes="132px"
            className="object-cover"
          />
        ) : (
          <div className="media-fallback">Gói chụp</div>
        )}
      </div>
      <div>
        <p className="font-extrabold">{packageItem.name}</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {currencyFormatter.format(packageItem.salePrice ?? packageItem.price)}
        </p>
        {packageItem.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
            {packageItem.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  helper,
  min,
  max,
  minLength,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  helper?: string;
  min?: number | string;
  max?: number;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <label className="form-label">
      {label} {required ? <RequiredMark /> : null}
      <input
        type={type}
        value={value}
        required={required}
        min={min}
        max={max}
        minLength={minLength}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="form-input"
      />
      {helper ? <span className="form-helper">{helper}</span> : null}
    </label>
  );
}

function RequiredMark() {
  return (
    <span aria-label="bắt buộc" className="text-red-700">
      *
    </span>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="theme-card p-4">
      <dt className="text-[var(--color-muted)]">{label}</dt>
      <dd className="mt-1 font-extrabold text-[var(--color-text)]">{value}</dd>
    </div>
  );
}

function getTodayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function getLocationTextForSelection(
  locationId: string,
  locations: PublicLocationListItem[],
): string {
  if (locationId === "custom") {
    return "";
  }

  const selectedLocation = locations.find((item) => item.id === locationId);

  return selectedLocation ? formatBookingLocation(selectedLocation) : "";
}

function getFriendlyErrorMessage(error: unknown): string {
  if (!(error instanceof BookingApiError)) {
    return "Không thể gửi yêu cầu lúc này. Vui lòng thử lại.";
  }

  switch (error.code) {
    case "BOOKING_RATE_LIMITED":
      return "Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau.";
    case "INVALID_BOOKING_PACKAGE":
      return "Vui lòng chọn gói chụp đang được mở đặt lịch.";
    case "INVALID_BOOKING_DATE":
      return "Ngày chụp không hợp lệ.";
    case "PAST_BOOKING_DATE":
      return "Ngày chụp không được ở quá khứ.";
    case "INVALID_BOOKING_PHONE":
      return "Số điện thoại không hợp lệ.";
    default:
      return error.status >= 500 || error.status === 0
        ? "Không thể gửi yêu cầu lúc này. Vui lòng thử lại."
        : "Vui lòng kiểm tra lại thông tin đặt lịch.";
  }
}
