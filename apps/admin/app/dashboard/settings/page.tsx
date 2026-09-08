"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { SingleMediaField } from "@/components/cms/media-field";
import type { MediaChoice } from "@/components/media/media-picker";
import {
  type AdminSettings,
  getSettings,
  updateSettings,
} from "@/lib/api/settings";
import {
  getAdminErrorMessage,
  loadErrorMessage,
  saveErrorMessage,
} from "@/lib/admin-labels";
import { withAuthRefresh } from "@/lib/api/session";
import { getPublicUrl } from "@/lib/site-url";

const navigationFields: Array<{
  key: keyof AdminSettings["navigation"];
  label: string;
}> = [
  { key: "showHome", label: "Trang ch\u1ee7" },
  { key: "showAbout", label: "Gi\u1edbi thi\u1ec7u" },
  { key: "showPackages", label: "G\u00f3i ch\u1ee5p" },
  { key: "showAlbums", label: "Album ảnh" },
  { key: "showNews", label: "Bài viết" },
  { key: "showLocations", label: "Cơ sở" },
  { key: "showContact", label: "Li\u00ean h\u1ec7" },
  { key: "showBooking", label: "\u0110\u1eb7t l\u1ecbch" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [logo, setLogo] = useState<MediaChoice[]>([]);
  const [favicon, setFavicon] = useState<MediaChoice[]>([]);
  const [ogImage, setOgImage] = useState<MediaChoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await withAuthRefresh(getSettings, redirectToLogin);

      if (!response) {
        return;
      }

      setSettings(response.data);
      setLogo(response.data.logo ? [response.data.logo] : []);
      setFavicon(response.data.favicon ? [response.data.favicon] : []);
      setOgImage(
        response.data.defaultSeo.ogImage
          ? [response.data.defaultSeo.ogImage]
          : [],
      );
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, loadErrorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadSettings]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!settings) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsSaving(true);

    try {
      const response = await withAuthRefresh(
        () =>
          updateSettings({
            studioName: settings.studioName,
            tagline: settings.tagline,
            logoMediaId: logo[0]?.id ?? null,
            faviconMediaId: favicon[0]?.id ?? null,
            contact: settings.contact,
            socials: settings.socials,
            navigation: settings.navigation,
            defaultSeo: {
              title: settings.defaultSeo.title,
              description: settings.defaultSeo.description,
              ogImageMediaId: ogImage[0]?.id ?? null,
            },
            footer: settings.footer,
          }),
        redirectToLogin,
      );

      if (!response) {
        return;
      }

      setSettings(response.data);
      setLogo(response.data.logo ? [response.data.logo] : []);
      setFavicon(response.data.favicon ? [response.data.favicon] : []);
      setOgImage(
        response.data.defaultSeo.ogImage
          ? [response.data.defaultSeo.ogImage]
          : [],
      );
      setNotice("Đã lưu cài đặt.");
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, saveErrorMessage));
    } finally {
      setIsSaving(false);
    }
  }

  function updateField<K extends keyof AdminSettings>(
    key: K,
    value: AdminSettings[K],
  ) {
    setSettings((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current,
    );
  }

  if (isLoading || !settings) {
    return (
      <main className="mx-auto w-full max-w-5xl">
        <p className="text-sm text-zinc-600">Đang tải cài đặt...</p>
      </main>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Hệ thống
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Cài đặt
          </h1>
        </div>
        <Link
          href={getPublicUrl("/")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold hover:bg-zinc-50"
        >
          Xem website
        </Link>
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

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <FormSection title="Thông tin thương hiệu">
          <TextField
            label="Tên Studio"
            value={settings.studioName}
            onChange={(studioName) => updateField("studioName", studioName)}
            maxLength={120}
            required
          />
          <TextArea
            label="Câu giới thiệu"
            value={settings.tagline}
            onChange={(tagline) => updateField("tagline", tagline)}
            maxLength={250}
            rows={3}
          />
          <div className="grid gap-5 md:grid-cols-2">
            <SingleMediaField
              label="Logo"
              pickerTitle="Chọn logo"
              value={logo}
              onChange={setLogo}
            />
            <SingleMediaField
              label="Biểu tượng website"
              pickerTitle="Chọn biểu tượng website"
              value={favicon}
              onChange={setFavicon}
            />
          </div>
        </FormSection>

        <FormSection title="Thông tin liên hệ">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              label="Số điện thoại"
              value={settings.contact.phone}
              onChange={(phone) =>
                updateField("contact", { ...settings.contact, phone })
              }
              maxLength={50}
            />
            <TextField
              label="Email"
              type="email"
              value={settings.contact.email}
              onChange={(email) =>
                updateField("contact", { ...settings.contact, email })
              }
            />
          </div>
          <TextArea
            label="Địa chỉ"
            value={settings.contact.address}
            onChange={(address) =>
              updateField("contact", { ...settings.contact, address })
            }
            maxLength={500}
            rows={3}
          />
        </FormSection>

        <FormSection title="Mạng xã hội">
          <div className="grid gap-5 md:grid-cols-2">
            {(
              [
                "facebook",
                "instagram",
                "tiktok",
                "youtube",
                "zalo",
              ] as const
            ).map((key) => (
              <TextField
                key={key}
                label={key}
                value={settings.socials[key]}
                onChange={(value) =>
                  updateField("socials", {
                    ...settings.socials,
                    [key]: value,
                  })
                }
                maxLength={1000}
              />
            ))}
          </div>
        </FormSection>

        <FormSection title="Menu website">
          <div className="grid gap-3 md:grid-cols-2">
            {navigationFields.map((field) => (
              <label
                key={field.key}
                className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
              >
                <input
                  type="checkbox"
                  checked={settings.navigation[field.key]}
                  onChange={(event) =>
                    updateField("navigation", {
                      ...settings.navigation,
                      [field.key]: event.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
                />
                {field.label}
              </label>
            ))}
          </div>
        </FormSection>

        <FormSection title="SEO mặc định">
          <TextField
            label="Tiêu đề SEO"
            value={settings.defaultSeo.title}
            onChange={(title) =>
              updateField("defaultSeo", { ...settings.defaultSeo, title })
            }
            maxLength={70}
          />
          <TextArea
            label="Mô tả SEO"
            value={settings.defaultSeo.description}
            onChange={(description) =>
              updateField("defaultSeo", {
                ...settings.defaultSeo,
                description,
              })
            }
            maxLength={180}
            rows={3}
          />
          <SingleMediaField
            label="Ảnh chia sẻ"
            pickerTitle="Chọn ảnh chia sẻ"
            value={ogImage}
            onChange={setOgImage}
          />
        </FormSection>

        <FormSection title="Chân trang">
          <TextArea
            label="Mô tả"
            value={settings.footer.description}
            onChange={(description) =>
              updateField("footer", { ...settings.footer, description })
            }
            maxLength={1000}
            rows={4}
          />
          <TextField
            label="Bản quyền"
            value={settings.footer.copyrightText}
            onChange={(copyrightText) =>
              updateField("footer", { ...settings.footer, copyrightText })
            }
            maxLength={250}
          />
        </FormSection>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
          </button>
        </div>
      </form>
    </section>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-[240px_1fr]">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        required={required}
        className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  maxLength,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  rows: number;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        rows={rows}
        className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}
