"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AdminBookingCalendarItem,
  type AdminBookingListItem,
  type BookingStatus,
  getBookingCalendar,
  getBookings,
} from "@/lib/api/bookings";
import { type AdminPackage, getPackages } from "@/lib/api/packages";
import { withAuthRefresh } from "@/lib/api/session";
import {
  bookingStatusLabels,
  getBookingStatusClass,
} from "@/lib/booking-status";

const PAGE_SIZE = 20;
const bookingStatuses: BookingStatus[] = [
  "new",
  "contacted",
  "confirmed",
  "deposit",
  "shooting",
  "completed",
  "cancelled",
];
const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function BookingsPage() {
  const router = useRouter();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [bookings, setBookings] = useState<AdminBookingListItem[]>([]);
  const [calendarBookings, setCalendarBookings] = useState<
    AdminBookingCalendarItem[]
  >([]);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [packageId, setPackageId] = useState("");
  const [shootDateFrom, setShootDateFrom] = useState("");
  const [shootDateTo, setShootDateTo] = useState("");
  const [sort, setSort] = useState("createdAt:desc");
  const [monthDate, setMonthDate] = useState(() => firstDayOfMonth(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const packagePromise = withAuthRefresh(
        () => getPackages({ limit: 100 }),
        redirectToLogin,
      );

      if (view === "calendar") {
        const { from, to } = getMonthRange(monthDate);
        const [packageResponse, calendarResponse] = await Promise.all([
          packagePromise,
          withAuthRefresh(
            () =>
              getBookingCalendar({
                from,
                to,
              }),
            redirectToLogin,
          ),
        ]);

        if (packageResponse) {
          setPackages(packageResponse.data);
        }

        if (calendarResponse) {
          setCalendarBookings(calendarResponse.data);
        }
      } else {
        const [packageResponse, bookingResponse] = await Promise.all([
          packagePromise,
          withAuthRefresh(
            () =>
              getBookings({
                page,
                limit: PAGE_SIZE,
                search: search.trim(),
                status,
                packageId,
                shootDateFrom,
                shootDateTo,
                sort,
              }),
            redirectToLogin,
          ),
        ]);

        if (packageResponse) {
          setPackages(packageResponse.data);
        }

        if (bookingResponse) {
          setBookings(bookingResponse.data);
          setTotalPages(bookingResponse.pagination.totalPages);
        }
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to load bookings."));
    } finally {
      setIsLoading(false);
    }
  }, [
    monthDate,
    packageId,
    page,
    redirectToLogin,
    search,
    shootDateFrom,
    shootDateTo,
    sort,
    status,
    view,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadData]);

  const calendarItemsByDate = useMemo(() => {
    const items = new Map<string, AdminBookingCalendarItem[]>();

    for (const booking of calendarBookings) {
      const dateItems = items.get(booking.shootDate) ?? [];

      dateItems.push(booking);
      items.set(booking.shootDate, dateItems);
    }

    return items;
  }, [calendarBookings]);

  function resetFilters() {
    setPage(1);
    setSearch("");
    setStatus("");
    setPackageId("");
    setShootDateFrom("");
    setShootDateTo("");
    setSort("createdAt:desc");
  }

  function changeMonth(offset: number) {
    setMonthDate((value) => {
      const next = new Date(value);

      next.setMonth(next.getMonth() + offset);

      return firstDayOfMonth(next);
    });
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Booking
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            {"\u0110\u1eb7t l\u1ecbch"}
          </h1>
        </div>

        <div className="inline-flex rounded-md border border-zinc-300 bg-white p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold ${
              view === "list"
                ? "bg-zinc-950 text-white"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <List size={16} />
            Danh s\u00e1ch
          </button>
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={`inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold ${
              view === "calendar"
                ? "bg-zinc-950 text-white"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <CalendarDays size={16} />
            L\u1ecbch
          </button>
        </div>
      </header>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {view === "list" ? (
        <>
          <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_150px_190px_150px_150px_160px_44px]">
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search code, customer, phone, email"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as BookingStatus | "");
              }}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All status</option>
              {bookingStatuses.map((item) => (
                <option key={item} value={item}>
                  {bookingStatusLabels[item]}
                </option>
              ))}
            </select>
            <select
              value={packageId}
              onChange={(event) => {
                setPage(1);
                setPackageId(event.target.value);
              }}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All packages</option>
              {packages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={shootDateFrom}
              onChange={(event) => {
                setPage(1);
                setShootDateFrom(event.target.value);
              }}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <input
              type="date"
              value={shootDateTo}
              onChange={(event) => {
                setPage(1);
                setShootDateTo(event.target.value);
              }}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <select
              value={sort}
              onChange={(event) => {
                setPage(1);
                setSort(event.target.value);
              }}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="createdAt:desc">Newest</option>
              <option value="createdAt:asc">Oldest</option>
              <option value="shootDate:asc">Shoot date asc</option>
              <option value="shootDate:desc">Shoot date desc</option>
              <option value="updatedAt:desc">Updated</option>
            </select>
            <button
              type="button"
              onClick={resetFilters}
              title="Reset filters"
              aria-label="Reset filters"
              className="flex size-10 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-50"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {isLoading ? (
            <p className="mt-8 text-sm text-zinc-600">Loading bookings...</p>
          ) : null}

          <BookingTable bookings={bookings} isLoading={isLoading} />

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
            >
              Previous
            </button>
            <span className="min-w-20 text-center text-sm text-zinc-600">
              {page} / {Math.max(totalPages, 1)}
            </span>
            <button
              type="button"
              disabled={totalPages === 0 || page >= totalPages || isLoading}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <section className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">
              {formatMonthLabel(monthDate)}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                title="Previous month"
                aria-label="Previous month"
                className="flex size-10 items-center justify-center rounded-md border border-zinc-300 bg-white transition hover:bg-zinc-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setMonthDate(firstDayOfMonth(new Date()))}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold transition hover:bg-zinc-50"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                title="Next month"
                aria-label="Next month"
                className="flex size-10 items-center justify-center rounded-md border border-zinc-300 bg-white transition hover:bg-zinc-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <p className="mt-8 text-sm text-zinc-600">Loading calendar...</p>
          ) : null}

          <div className="mt-5 grid grid-cols-7 rounded-lg border border-zinc-200 bg-white shadow-sm">
            {weekDays.map((day) => (
              <div
                key={day}
                className="border-b border-zinc-200 px-3 py-2 text-xs font-semibold uppercase tracking-normal text-zinc-500"
              >
                {day}
              </div>
            ))}
            {getCalendarCells(monthDate).map((cell) => (
              <CalendarCell
                key={cell.date}
                cell={cell}
                bookings={calendarItemsByDate.get(cell.date) ?? []}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function BookingTable({
  bookings,
  isLoading,
}: {
  bookings: AdminBookingListItem[];
  isLoading: boolean;
}) {
  return (
    <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-normal text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Code</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Phone</th>
            <th className="px-4 py-3 font-semibold">Package</th>
            <th className="px-4 py-3 font-semibold">Shoot date</th>
            <th className="px-4 py-3 font-semibold">Time</th>
            <th className="px-4 py-3 font-semibold">Location</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Created</th>
            <th className="px-4 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {!isLoading && bookings.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-8 text-center text-zinc-500">
                No bookings found.
              </td>
            </tr>
          ) : null}

          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td className="px-4 py-3 font-semibold">{booking.code}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{booking.customerName}</p>
                {booking.email ? (
                  <p className="mt-1 text-xs text-zinc-500">{booking.email}</p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-zinc-600">{booking.phone}</td>
              <td className="px-4 py-3 text-zinc-600">
                {booking.package.name}
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {formatDate(booking.shootDate)}
              </td>
              <td className="px-4 py-3 text-zinc-600">{booking.shootTime}</td>
              <td className="max-w-56 truncate px-4 py-3 text-zinc-600">
                {booking.location}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={booking.status} />
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {formatDateTime(booking.createdAt)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/bookings/${booking.id}`}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold transition hover:bg-zinc-50"
                >
                  View / Manage
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalendarCell({
  cell,
  bookings,
}: {
  cell: CalendarDay;
  bookings: AdminBookingCalendarItem[];
}) {
  return (
    <div
      className={`min-h-36 border-b border-r border-zinc-200 p-2 ${
        cell.inMonth ? "bg-white" : "bg-zinc-50 text-zinc-400"
      }`}
    >
      <p className="text-xs font-semibold">{cell.day}</p>
      <div className="mt-2 space-y-1">
        {bookings.slice(0, 4).map((booking) => (
          <Link
            key={booking.id}
            href={`/dashboard/bookings/${booking.id}`}
            className={`block rounded-md border px-2 py-1 text-xs leading-4 ${getBookingStatusClass(
              booking.status,
            )}`}
          >
            <span className="font-semibold">{booking.shootTime}</span>{" "}
            {booking.customerName}
            <span className="block truncate">{booking.package.name}</span>
          </Link>
        ))}
        {bookings.length > 4 ? (
          <p className="text-xs text-zinc-500">+{bookings.length - 4} more</p>
        ) : null}
      </div>
    </div>
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

interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
}

function getCalendarCells(monthDate: Date): CalendarDay[] {
  const first = firstDayOfMonth(monthDate);
  const start = new Date(first);
  const dayOffset = (first.getDay() + 6) % 7;

  start.setDate(start.getDate() - dayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);

    date.setDate(start.getDate() + index);

    return {
      date: toLocalDateInput(date),
      day: date.getDate(),
      inMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

function getMonthRange(monthDate: Date): { from: string; to: string } {
  const from = firstDayOfMonth(monthDate);
  const to = new Date(from);

  to.setMonth(to.getMonth() + 1);
  to.setDate(0);

  return {
    from: toLocalDateInput(from),
    to: toLocalDateInput(to),
  };
}

function firstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(date);
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
