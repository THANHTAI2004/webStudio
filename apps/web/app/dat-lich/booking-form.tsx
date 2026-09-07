"use client";

import Image from "next/image";
import { type FormEvent, useMemo, useState } from "react";
import {
  BookingApiError,
  createBooking,
  type PublicBooking,
} from "@/lib/api/bookings";
import { getMediaAssetUrl } from "@/lib/api/client";
import type { PublicPackageListItem } from "@/lib/api/packages";

interface BookingFormProps {
  packages: PublicPackageListItem[];
  preselectedPackageSlug?: string;
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export function BookingForm({
  packages,
  preselectedPackageSlug,
}: BookingFormProps) {
  const preselectedPackage = packages.find(
    (item) => item.slug === preselectedPackageSlug,
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
  const [location, setLocation] = useState("");
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
      setError("Vui l\u00f2ng ch\u1ecdn g\u00f3i ch\u1ee5p.");
      return;
    }

    if (
      !Number.isInteger(parsedPeopleCount) ||
      parsedPeopleCount < 1 ||
      parsedPeopleCount > 50
    ) {
      setError("S\u1ed1 ng\u01b0\u1eddi ph\u1ea3i t\u1eeb 1 \u0111\u1ebfn 50.");
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
      setLocation("");
      setCustomerNote("");
    } catch (caughtError) {
      setError(getFriendlyErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <section className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
          \u0110\u1eb7t l\u1ecbch th\u00e0nh c\u00f4ng
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{confirmation.code}</h2>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <SummaryItem
            label="G\u00f3i ch\u1ee5p"
            value={confirmation.package.name}
          />
          <SummaryItem
            label="Ng\u00e0y"
            value={formatDate(confirmation.shootDate)}
          />
          <SummaryItem label="Gi\u1edd" value={confirmation.shootTime} />
          <SummaryItem label="Tr\u1ea1ng th\u00e1i" value="M\u1edbi" />
        </dl>
        <p className="mt-6 rounded-md bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          Studio s\u1ebd li\u00ean h\u1ec7 v\u1edbi b\u1ea1n \u0111\u1ec3
          x\u00e1c nh\u1eadn l\u1ecbch.
        </p>
        <button
          type="button"
          onClick={() => setConfirmation(null)}
          className="mt-6 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-zinc-50"
        >
          G\u1eedi y\u00eau c\u1ea7u kh\u00e1c
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      {error ? (
        <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="H\u1ecd v\u00e0 t\u00ean"
            value={customerName}
            onChange={setCustomerName}
            minLength={2}
            maxLength={120}
            required
          />
          <TextField
            label="S\u1ed1 \u0111i\u1ec7n tho\u1ea1i"
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
          />
          <label className="block text-sm font-medium text-zinc-700">
            G\u00f3i ch\u1ee5p
            <select
              value={packageId}
              onChange={(event) => setPackageId(event.target.value)}
              disabled={packages.length === 0}
              required
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
            >
              {packages.length === 0 ? (
                <option value="">Ch\u01b0a c\u00f3 g\u00f3i ch\u1ee5p</option>
              ) : null}
              {packages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} -{" "}
                  {currencyFormatter.format(item.salePrice ?? item.price)}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="Ng\u00e0y ch\u1ee5p"
            type="date"
            value={shootDate}
            onChange={setShootDate}
            min={today}
            required
          />
          <TextField
            label="Gi\u1edd"
            type="time"
            value={shootTime}
            onChange={setShootTime}
            required
          />
          <TextField
            label="S\u1ed1 ng\u01b0\u1eddi"
            type="number"
            value={peopleCount}
            onChange={setPeopleCount}
            min={1}
            max={50}
            required
          />
          <TextField
            label="\u0110\u1ecba \u0111i\u1ec3m mong mu\u1ed1n"
            value={location}
            onChange={setLocation}
            maxLength={300}
            required
          />
        </div>

        {selectedPackage ? (
          <PackagePreview packageItem={selectedPackage} />
        ) : null}

        <label className="block text-sm font-medium text-zinc-700">
          Ghi ch\u00fa
          <textarea
            value={customerNote}
            onChange={(event) => setCustomerNote(event.target.value)}
            maxLength={2000}
            rows={4}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting || packages.length === 0}
          className="w-full rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting
            ? "\u0110ang g\u1eedi..."
            : "G\u1eedi y\u00eau c\u1ea7u \u0111\u1eb7t l\u1ecbch"}
        </button>
      </form>
    </section>
  );
}

function PackagePreview({
  packageItem,
}: {
  packageItem: PublicPackageListItem;
}) {
  return (
    <div className="grid gap-4 rounded-md border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-[120px_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-zinc-100">
        {packageItem.thumbnail ? (
          <Image
            src={getMediaAssetUrl(packageItem.thumbnail.url)}
            alt={packageItem.thumbnail.alt || packageItem.name}
            fill
            sizes="120px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            Studio
          </div>
        )}
      </div>
      <div>
        <p className="font-semibold">{packageItem.name}</p>
        <p className="mt-1 text-sm text-zinc-600">
          {currencyFormatter.format(packageItem.salePrice ?? packageItem.price)}
        </p>
        {packageItem.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">
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
  min?: number | string;
  max?: number;
  minLength?: number;
  maxLength?: number;
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
        minLength={minLength}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="mt-1 font-semibold text-zinc-950">{value}</dd>
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

function getFriendlyErrorMessage(error: unknown): string {
  if (!(error instanceof BookingApiError)) {
    return "Kh\u00f4ng th\u1ec3 g\u1eedi y\u00eau c\u1ea7u l\u00fac n\u00e0y. Vui l\u00f2ng th\u1eed l\u1ea1i.";
  }

  switch (error.code) {
    case "BOOKING_RATE_LIMITED":
      return "B\u1ea1n \u0111ang g\u1eedi qu\u00e1 nhi\u1ec1u y\u00eau c\u1ea7u. Vui l\u00f2ng th\u1eed l\u1ea1i sau.";
    case "INVALID_BOOKING_PACKAGE":
      return "Vui l\u00f2ng ch\u1ecdn g\u00f3i ch\u1ee5p \u0111ang \u0111\u01b0\u1ee3c m\u1edf \u0111\u1eb7t l\u1ecbch.";
    case "INVALID_BOOKING_DATE":
      return "Ng\u00e0y ch\u1ee5p kh\u00f4ng h\u1ee3p l\u1ec7.";
    case "PAST_BOOKING_DATE":
      return "Ng\u00e0y ch\u1ee5p kh\u00f4ng \u0111\u01b0\u1ee3c \u1edf qu\u00e1 kh\u1ee9.";
    case "INVALID_BOOKING_PHONE":
      return "S\u1ed1 \u0111i\u1ec7n tho\u1ea1i kh\u00f4ng h\u1ee3p l\u1ec7.";
    default:
      return error.status >= 500 || error.status === 0
        ? "Kh\u00f4ng th\u1ec3 g\u1eedi y\u00eau c\u1ea7u l\u00fac n\u00e0y. Vui l\u00f2ng th\u1eed l\u1ea1i."
        : "Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i th\u00f4ng tin \u0111\u1eb7t l\u1ecbch.";
  }
}
