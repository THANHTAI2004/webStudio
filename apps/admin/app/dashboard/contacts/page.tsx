"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  type AdminContactListItem,
  type ContactStatus,
  getContacts,
} from "@/lib/api/contacts";
import { type AdminLocation, getLocations } from "@/lib/api/locations";
import {
  customLabel,
  formatAdminDateTime,
  getAdminErrorMessage,
  loadErrorMessage,
} from "@/lib/admin-labels";
import { withAuthRefresh } from "@/lib/api/session";
import {
  contactStatusLabels,
  getContactStatusClass,
} from "@/lib/contact-status";

const PAGE_SIZE = 20;
const contactStatuses: ContactStatus[] = ["new", "read", "replied", "archived"];

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<AdminContactListItem[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContactStatus | "">("");
  const [locationId, setLocationId] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [contactResponse, locationResponse] = await Promise.all([
        withAuthRefresh(
          () =>
            getContacts({
              page,
              limit: PAGE_SIZE,
              search: search.trim(),
              status,
              locationId,
              createdFrom,
              createdTo,
              sort: "createdAt:desc",
            }),
          redirectToLogin,
        ),
        withAuthRefresh(
          () => getLocations({ page: 1, limit: 100, sort: "sortOrder:asc" }),
          redirectToLogin,
        ),
      ]);

      if (!contactResponse || !locationResponse) {
        return;
      }

      setContacts(contactResponse.data);
      setTotalPages(contactResponse.pagination.totalPages);
      setLocations(locationResponse.data);
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, loadErrorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [
    createdFrom,
    createdTo,
    locationId,
    page,
    redirectToLogin,
    search,
    status,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadData]);

  return (
    <section className="mx-auto w-full max-w-7xl">
      <header className="border-b border-zinc-200 pb-6">
        <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
          Liên hệ
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          Hộp thư liên hệ
        </h1>
      </header>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_170px_220px_160px_160px]">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Tìm mã, khách hàng, chủ đề"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value as ContactStatus | "");
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">Tất cả trạng thái</option>
          {contactStatuses.map((item) => (
            <option key={item} value={item}>
              {contactStatusLabels[item]}
            </option>
          ))}
        </select>
        <select
          value={locationId}
          onChange={(event) => {
            setPage(1);
            setLocationId(event.target.value);
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">Tất cả cơ sở</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={createdFrom}
          onChange={(event) => {
            setPage(1);
            setCreatedFrom(event.target.value);
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
        <input
          type="date"
          value={createdTo}
          onChange={(event) => {
            setPage(1);
            setCreatedTo(event.target.value);
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-sm text-zinc-600">Đang tải...</p>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-normal text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Mã liên hệ</th>
              <th className="px-4 py-3 font-semibold">Khách hàng</th>
              <th className="px-4 py-3 font-semibold">Số điện thoại</th>
              <th className="px-4 py-3 font-semibold">Chủ đề</th>
              <th className="px-4 py-3 font-semibold">Cơ sở</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Ngày tạo</th>
              <th className="px-4 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {!isLoading && contacts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  Không tìm thấy kết quả.
                </td>
              </tr>
            ) : null}

            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td className="px-4 py-3 font-semibold">{contact.code}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{contact.customerName}</p>
                  {contact.email ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      {contact.email}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-zinc-600">{contact.phone}</td>
                <td className="max-w-xs px-4 py-3 text-zinc-600">
                  <p className="line-clamp-2">{contact.subject}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {contact.location?.name ?? customLabel}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={contact.status} />
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatAdminDateTime(contact.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/contacts/${contact.id}`}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold transition hover:bg-zinc-50"
                  >
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={page <= 1 || isLoading}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
        >
          Trước
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
          Sau
        </button>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${getContactStatusClass(
        status,
      )}`}
    >
      {contactStatusLabels[status]}
    </span>
  );
}
