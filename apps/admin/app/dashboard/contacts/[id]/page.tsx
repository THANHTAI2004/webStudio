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
  { status: "archived", label: "L\u01b0u tr\u1eef" },
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
      setError(getErrorMessage(caughtError, "Unable to load contact."));
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
        setNotice("Contact status saved.");
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to update contact."));
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
        setNotice("Admin note saved.");
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to save note."));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <p className="text-sm text-zinc-600">Loading contact...</p>
      </section>
    );
  }

  if (!contact) {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? "Contact not found."}
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
          Contacts
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              {contact.code}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {formatDate(contact.createdAt)}
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
            <h2 className="text-lg font-semibold">Message</h2>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <SummaryItem label="Name" value={contact.customerName} />
              <SummaryItem label="Phone" value={contact.phone} />
              <SummaryItem label="Email" value={contact.email ?? "None"} />
              <SummaryItem
                label="Location"
                value={contact.location?.name ?? "Custom / None"}
              />
              <SummaryItem label="Subject" value={contact.subject} wide />
            </dl>
            <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="whitespace-pre-line text-sm leading-6 text-zinc-700">
                {contact.message}
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Admin Note</h2>
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
              {isSaving ? "Saving..." : "Save Note"}
            </button>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Actions</h2>
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
                  {updatingStatus === action.status ? "Saving..." : action.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 text-sm shadow-sm">
            <h2 className="text-lg font-semibold">Details</h2>
            <dl className="mt-5 space-y-4">
              <SummaryItem label="Code" value={contact.code} />
              <SummaryItem label="Created At" value={formatDate(contact.createdAt)} />
              <SummaryItem label="Updated At" value={formatDate(contact.updatedAt)} />
              <SummaryItem label="Source" value={contact.source} />
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
