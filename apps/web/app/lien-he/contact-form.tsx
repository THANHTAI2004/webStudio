"use client";

import Link from "next/link";
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
      setError("Nội dung cần tối thiểu 5 ký tự.");
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
      <section className="public-form-card" aria-live="polite">
        <p className="section-eyebrow">Đã gửi liên hệ</p>
        <h2
          className="mt-3 text-3xl font-semibold leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Studio đã nhận được thông tin
        </h2>
        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
          Mã liên hệ của bạn là{" "}
          <span className="font-extrabold text-[var(--color-text)]">
            {confirmation.code}
          </span>
          . Studio sẽ phản hồi bạn sớm nhất có thể.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setConfirmation(null)}
            className="theme-button-secondary"
          >
            Gửi liên hệ khác
          </button>
          <Link href="/goi-chup" className="theme-button-primary">
            Xem gói chụp
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="public-form-card">
      <p className="section-eyebrow">Biểu mẫu liên hệ</p>
      <h2
        className="mt-3 text-3xl font-semibold leading-tight"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Gửi yêu cầu tư vấn
      </h2>

      {error ? (
        <p className="form-message form-message--error mt-5">{error}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <TextField
          label="Họ tên"
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
          maxLength={50}
          required
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          helper="Không bắt buộc, nhưng hữu ích nếu bạn muốn nhận tư vấn qua email."
        />
        <label className="form-label">
          Cơ sở quan tâm
          <select
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            className="form-select"
          >
            <option value="">Chưa chọn cơ sở</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <TextField
          label="Chủ đề"
          value={subject}
          onChange={setSubject}
          maxLength={200}
          required
        />
        <label className="form-label">
          Nội dung <RequiredMark />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            minLength={5}
            maxLength={5000}
            rows={7}
            required
            className="form-textarea"
          />
          <span className="form-helper">
            Hãy mô tả nhu cầu chụp, thời gian dự kiến hoặc phong cách bạn thích.
          </span>
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="theme-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Đang gửi..." : "Gửi liên hệ"}
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
  helper,
  minLength,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  helper?: string;
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

function getFriendlyErrorMessage(error: unknown): string {
  if (!(error instanceof ContactApiError)) {
    return "Không thể gửi liên hệ lúc này. Vui lòng thử lại.";
  }

  switch (error.code) {
    case "CONTACT_RATE_LIMITED":
      return "Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau.";
    case "INVALID_CONTACT_PHONE":
      return "Số điện thoại không hợp lệ.";
    case "INVALID_CONTACT_LOCATION":
      return "Cơ sở bạn chọn không còn khả dụng.";
    default:
      return error.status >= 500 || error.status === 0
        ? "Không thể gửi liên hệ lúc này. Vui lòng thử lại."
        : "Vui lòng kiểm tra lại thông tin liên hệ.";
  }
}
