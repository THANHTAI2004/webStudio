"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  type AdminContactDetail,
  type ContactStatus,
  getContact,
  updateContact,
} from "@/lib/api/contacts";
import {
  customLabel,
  emptyLabel,
  formatAdminDateTime,
  getAdminErrorMessage,
  loadErrorMessage,
  saveErrorMessage,
} from "@/lib/admin-labels";
import { withAuthRefresh } from "@/lib/api/session";
import {
  contactStatusLabels,
  getContactStatusClass,
} from "@/lib/contact-status";

const statusActions: Array<{
  status: ContactStatus;
  label: string;
}> = [
  { status: "read", label: "\u0110\u00e1nh d\u1ea5u \u0111\u00e3 \u0111\u1ecdc" },
  { status: "replied", label: "\u0110\u00e3 ph\u1ea3n h\u1ed3i" },
  { status: "archived", label: "Lưu trữ" },
];

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<AdminContactDetail | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<ContactStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const loadContact = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await withAuthRefresh(
        () => getContact(params.id),
        redirectToLogin,
      );

      if (!response) {
        return;
      }

      setContact(response.data);
      setAdminNote(response.data.adminNote);
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, loadErrorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [params.id, redirectToLogin]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadContact();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadContact]);

  async function handleStatusUpdate(status: ContactStatus) {
    if (!contact) {
      return;
    }

    setUpdatingStatus(status);
    setError(null);
    setNotice(null);

    try {
      const response = await withAuthRefresh(
        () => updateContact(contact.id, { status }),
        redirectToLogin,
      );

      if (response) {
        setContact(response.data);
        setAdminNote(response.data.adminNote);
        setNotice("Đã cập nhật trạng thái liên hệ.");
      }
    } catch (caughtError) {
      setError(
        getAdminErrorMessage(
          caughtError,
          "Không thể cập nhật liên hệ. Vui lòng thử lại.",
        ),
      );
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleNoteSave() {
    if (!contact) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await withAuthRefresh(
        () => updateContact(contact.id, { adminNote }),
        redirectToLogin,
      );

      if (response) {
        setContact(response.data);
        setNotice("Đã lưu ghi chú nội bộ.");
      }
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, saveErrorMessage));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <p className="text-sm text-zinc-600">Đang tải...</p>
      </section>
    );
  }

  if (!contact) {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? "Không tìm thấy liên hệ."}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <header className="border-b border-zinc-200 pb-6">
        <Link
          href="/dashboard/contacts"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          Liên hệ
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              {contact.code}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {formatAdminDateTime(contact.createdAt)}
            </p>
          </div>
          <StatusBadge status={contact.status} />
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

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Nội dung liên hệ</h2>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <SummaryItem label="Tên" value={contact.customerName} />
              <SummaryItem label="Số điện thoại" value={contact.phone} />
              <SummaryItem label="Email" value={contact.email ?? emptyLabel} />
              <SummaryItem
                label="Cơ sở"
                value={contact.location?.name ?? `${customLabel} / ${emptyLabel}`}
              />
              <SummaryItem label="Chủ đề" value={contact.subject} wide />
            </dl>
            <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="whitespace-pre-line text-sm leading-6 text-zinc-700">
                {contact.message}
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Ghi chú nội bộ</h2>
            <textarea
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              maxLength={5000}
              rows={7}
              className="mt-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="button"
              onClick={() => void handleNoteSave()}
              disabled={isSaving}
              className="mt-4 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isSaving ? "Đang lưu..." : "Lưu ghi chú"}
            </button>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Thao tác</h2>
            <div className="mt-4 grid gap-2">
              {statusActions.map((action) => (
                <button
                  key={action.status}
                  type="button"
                  onClick={() => void handleStatusUpdate(action.status)}
                  disabled={
                    updatingStatus !== null || contact.status === action.status
                  }
                  className="rounded-md border border-zinc-300 px-3 py-2 text-left text-sm font-semibold transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
                >
                  {updatingStatus === action.status
                    ? "Đang lưu..."
                    : action.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 text-sm shadow-sm">
            <h2 className="text-lg font-semibold">Chi tiết</h2>
            <dl className="mt-5 space-y-4">
              <SummaryItem label="Mã liên hệ" value={contact.code} />
              <SummaryItem
                label="Ngày tạo"
                value={formatAdminDateTime(contact.createdAt)}
              />
              <SummaryItem
                label="Cập nhật lần cuối"
                value={formatAdminDateTime(contact.updatedAt)}
              />
              <SummaryItem label="Nguồn" value={formatSource(contact.source)} />
            </dl>
          </section>
        </aside>
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

function SummaryItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-zinc-950">{value}</dd>
    </div>
  );
}

function formatSource(source: string): string {
  return source === "website" ? "Trang web" : source;
}
