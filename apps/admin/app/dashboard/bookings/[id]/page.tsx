"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type AdminBookingDetail,
  type BookingStatus,
  getBooking,
  updateBooking,
  updateBookingStatus,
} from "@/lib/api/bookings";
import { type AdminPackage, getPackages } from "@/lib/api/packages";
import { withAuthRefresh } from "@/lib/api/session";
import {
  bookingStatusLabels,
  getBookingStatusClass,
} from "@/lib/booking-status";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [form, setForm] = useState<BookingFormState | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<BookingStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [bookingResponse, packageResponse] = await Promise.all([
        withAuthRefresh(() => getBooking(params.id), redirectToLogin),
        withAuthRefresh(() => getPackages({ limit: 100 }), redirectToLogin),
      ]);

      if (bookingResponse) {
        setBooking(bookingResponse.data);
        setForm(toFormState(bookingResponse.data));
      }

      if (packageResponse) {
        setPackages(packageResponse.data);
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to load booking."));
    } finally {
      setIsLoading(false);
    }
  }, [params.id, redirectToLogin]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadData]);

  const packageOptions = useMemo(() => {
    if (!booking) {
      return packages;
    }

    if (packages.some((item) => item.id === booking.packageId)) {
      return packages;
    }

    return [
      {
        id: booking.packageId,
        name: booking.packageSnapshot.name,
        slug: booking.packageSnapshot.slug,
        categoryId: "",
        category: null,
        thumbnailMediaId: null,
        thumbnail: null,
        galleryMediaIds: [],
        gallery: [],
        price: booking.packageSnapshot.price,
        salePrice: booking.packageSnapshot.salePrice,
        durationMinutes: null,
        features: [],
        description: "",
        content: "",
        status: "published" as const,
        isFeatured: false,
        sortOrder: 0,
        seo: {
          title: "",
          description: "",
          ogImageMediaId: null,
          ogImage: null,
        },
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
      ...packages,
    ];
  }, [booking, packages]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    const peopleCount = Number(form.peopleCount);

    if (!Number.isInteger(peopleCount) || peopleCount < 1 || peopleCount > 50) {
      setError("S\u1ed1 ng\u01b0\u1eddi ph\u1ea3i t\u1eeb 1 \u0111\u1ebfn 50.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await withAuthRefresh(
        () =>
          updateBooking(params.id, {
            customerName: form.customerName,
            phone: form.phone,
            email: form.email.trim() || null,
            packageId: form.packageId,
            shootDate: form.shootDate,
            shootTime: form.shootTime,
            peopleCount,
            location: form.location,
            customerNote: form.customerNote,
            adminNote: form.adminNote,
          }),
        redirectToLogin,
      );

      if (response) {
        setBooking(response.data);
        setForm(toFormState(response.data));
        setNotice("Booking saved.");
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to save booking."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusTransition(status: BookingStatus) {
    setUpdatingStatus(status);
    setError(null);
    setNotice(null);

    try {
      const response = await withAuthRefresh(
        () =>
          updateBookingStatus(params.id, {
            status,
            note: statusNote.trim() || undefined,
          }),
        redirectToLogin,
      );

      if (response) {
        setBooking(response.data);
        setForm(toFormState(response.data));
        setStatusNote("");
        setNotice("Status updated.");
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to update status."));
    } finally {
      setUpdatingStatus(null);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl">
        <p className="text-sm text-zinc-600">Loading booking...</p>
      </main>
    );
  }

  if (!booking || !form) {
    return (
      <main className="mx-auto w-full max-w-6xl">
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? "Booking not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/dashboard/bookings"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {"\u0110\u1eb7t l\u1ecbch"}
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            {booking.code}
          </h1>
          <div className="mt-3">
            <StatusBadge status={booking.status} />
          </div>
        </div>
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
          <p>{formatDate(booking.shootDate)}</p>
          <p className="mt-1 font-semibold text-zinc-950">
            {booking.shootTime}
          </p>
        </div>
      </header>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <form onSubmit={handleSave} className="space-y-8">
          <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
            <h2 className="text-lg font-semibold">Customer</h2>
            <div className="space-y-5">
              <TextField
                label="Name"
                value={form.customerName}
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, customerName: value } : current,
                  )
                }
                required
              />
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, phone: value } : current,
                  )
                }
                required
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, email: value } : current,
                  )
                }
              />
            </div>
          </section>

          <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
            <h2 className="text-lg font-semibold">Package snapshot</h2>
            <div className="space-y-5">
              <label className="block text-sm font-medium text-zinc-700">
                Package
                <select
                  value={form.packageId}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? { ...current, packageId: event.target.value }
                        : current,
                    )
                  }
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  {packageOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm">
                <p className="font-semibold">{booking.packageSnapshot.name}</p>
                <p className="mt-1 text-zinc-500">
                  {booking.packageSnapshot.slug}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <p>
                    Price:{" "}
                    {currencyFormatter.format(booking.packageSnapshot.price)}
                  </p>
                  {booking.packageSnapshot.salePrice !== null ? (
                    <p>
                      Sale:{" "}
                      {currencyFormatter.format(
                        booking.packageSnapshot.salePrice,
                      )}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
            <h2 className="text-lg font-semibold">Schedule</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Date"
                type="date"
                value={form.shootDate}
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, shootDate: value } : current,
                  )
                }
                required
              />
              <TextField
                label="Time"
                type="time"
                value={form.shootTime}
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, shootTime: value } : current,
                  )
                }
                required
              />
              <TextField
                label="People"
                type="number"
                value={form.peopleCount}
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, peopleCount: value } : current,
                  )
                }
                required
              />
              <TextField
                label="Location"
                value={form.location}
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, location: value } : current,
                  )
                }
                required
              />
            </div>
          </section>

          <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-2">
            <h2 className="text-lg font-semibold">Notes</h2>
            <div className="space-y-5">
              <TextAreaField
                label="Customer Note"
                value={form.customerNote}
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, customerNote: value } : current,
                  )
                }
              />
              <TextAreaField
                label="Admin Note"
                value={form.adminNote}
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, adminNote: value } : current,
                  )
                }
              />
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Workflow</h2>
            <label className="mt-4 block text-sm font-medium text-zinc-700">
              Status note
              <textarea
                value={statusNote}
                onChange={(event) => setStatusNote(event.target.value)}
                rows={3}
                maxLength={500}
                className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="mt-4 grid gap-2">
              {booking.allowedTransitions.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={updatingStatus !== null}
                  onClick={() => void handleStatusTransition(status)}
                  className={`rounded-md border px-3 py-2 text-left text-sm font-semibold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 ${getBookingStatusClass(
                    status,
                  )}`}
                >
                  {updatingStatus === status
                    ? "Updating..."
                    : bookingStatusLabels[status]}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Status History</h2>
            <ol className="mt-5 space-y-4">
              {booking.statusHistory.map((item, index) => (
                <li
                  key={`${item.status}-${item.changedAt}-${index}`}
                  className="border-l-2 border-zinc-200 pl-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    <p className="text-xs text-zinc-500">
                      {formatDateTime(item.changedAt)}
                    </p>
                  </div>
                  {item.note ? (
                    <p className="mt-2 text-sm text-zinc-700">{item.note}</p>
                  ) : null}
                  {item.admin ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.admin.name}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}

interface BookingFormState {
  customerName: string;
  phone: string;
  email: string;
  packageId: string;
  shootDate: string;
  shootTime: string;
  peopleCount: string;
  location: string;
  customerNote: string;
  adminNote: string;
}

function toFormState(booking: AdminBookingDetail): BookingFormState {
  return {
    customerName: booking.customerName,
    phone: booking.phone,
    email: booking.email ?? "",
    packageId: booking.packageId,
    shootDate: booking.shootDate,
    shootTime: booking.shootTime,
    peopleCount: String(booking.peopleCount),
    location: booking.location,
    customerNote: booking.customerNote,
    adminNote: booking.adminNote,
  };
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${getBookingStatusClass(
        status,
      )}`}
    >
      {bookingStatusLabels[status]}
    </span>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
