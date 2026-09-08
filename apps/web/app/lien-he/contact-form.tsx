"use client";

import { type FormEvent, useState } from "react";
import {
  ContactApiError,
  createContact,
  type PublicContact,
} from "@/lib/api/contacts";
import type { PublicLocationListItem } from "@/lib/api/locations";

interface ContactFormProps {
  locations: PublicLocationListItem[];
}

export function ContactForm({ locations }: ContactFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [locationId, setLocationId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<PublicContact | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setConfirmation(null);

    if (message.trim().length < 5) {
      setError("N\u1ed9i dung c\u1ea7n t\u1ed1i thi\u1ec3u 5 k\u00fd t\u1ef1.");
      return;
    }

    setIsSubmitting(true);

    try {
      const contact = await createContact({
        customerName,
        phone,
        email: email.trim() || null,
        locationId: locationId || null,
        subject,
        message,
      });

      setConfirmation(contact);
      setCustomerName("");
      setPhone("");
      setEmail("");
      setLocationId("");
      setSubject("");
      setMessage("");
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
          {"G\u1eedi li\u00ean h\u1ec7 th\u00e0nh c\u00f4ng"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{confirmation.code}</h2>
        <p className="mt-6 rounded-md bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          {
            "Studio s\u1ebd ph\u1ea3n h\u1ed3i b\u1ea1n s\u1edbm nh\u1ea5t c\u00f3 th\u1ec3."
          }
        </p>
        <button
          type="button"
          onClick={() => setConfirmation(null)}
          className="mt-6 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-zinc-50"
        >
          {"G\u1eedi li\u00ean h\u1ec7 kh\u00e1c"}
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="H\u1ecd t\u00ean"
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
          maxLength={50}
          required
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
        />
        <label className="block text-sm font-medium text-zinc-700">
          {"C\u01a1 s\u1edf quan t\u00e2m"}
          <select
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">{"Ch\u01b0a ch\u1ecdn c\u01a1 s\u1edf"}</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <TextField
          label="Ch\u1ee7 \u0111\u1ec1"
          value={subject}
          onChange={setSubject}
          maxLength={200}
          required
        />
        <label className="block text-sm font-medium text-zinc-700">
          {"N\u1ed9i dung"}
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            minLength={5}
            maxLength={5000}
            rows={7}
            required
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting
            ? "\u0110ang g\u1eedi..."
            : "G\u1eedi li\u00ean h\u1ec7"}
        </button>
      </form>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  minLength,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
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
        minLength={minLength}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function getFriendlyErrorMessage(error: unknown): string {
  if (!(error instanceof ContactApiError)) {
    return "Kh\u00f4ng th\u1ec3 g\u1eedi li\u00ean h\u1ec7 l\u00fac n\u00e0y. Vui l\u00f2ng th\u1eed l\u1ea1i.";
  }

  switch (error.code) {
    case "CONTACT_RATE_LIMITED":
      return "B\u1ea1n \u0111ang g\u1eedi qu\u00e1 nhi\u1ec1u y\u00eau c\u1ea7u. Vui l\u00f2ng th\u1eed l\u1ea1i sau.";
    case "INVALID_CONTACT_PHONE":
      return "S\u1ed1 \u0111i\u1ec7n tho\u1ea1i kh\u00f4ng h\u1ee3p l\u1ec7.";
    case "INVALID_CONTACT_LOCATION":
      return "C\u01a1 s\u1edf b\u1ea1n ch\u1ecdn kh\u00f4ng c\u00f2n kh\u1ea3 d\u1ee5ng.";
    default:
      return error.status >= 500 || error.status === 0
        ? "Kh\u00f4ng th\u1ec3 g\u1eedi li\u00ean h\u1ec7 l\u00fac n\u00e0y. Vui l\u00f2ng th\u1eed l\u1ea1i."
        : "Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i th\u00f4ng tin li\u00ean h\u1ec7.";
  }
}
