import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHero, SectionHeader } from "@/components/ui/public-ui";
import { getLocations } from "@/lib/api/locations";
import { getPublicSettings } from "@/lib/api/settings";
import { ContactForm } from "./contact-form";

const TITLE = "Liên hệ";

export const metadata: Metadata = {
  title: `${TITLE} | Studio`,
  description:
    "Gửi thông tin liên hệ cho Studio để được tư vấn lịch chụp và dịch vụ phù hợp.",
  alternates: {
    canonical: getCanonicalPath("/lien-he"),
  },
};

export default async function ContactPage() {
  const [settings, locations] = await Promise.all([
    getPublicSettings({ cache: "no-store" }),
    getLocations({ cache: "no-store" }),
  ]);

  return (
    <main>
      <PageHero
        eyebrow="Tư vấn"
        title={TITLE}
        description="Chia sẻ nhu cầu của bạn, Studio sẽ phản hồi với thông tin phù hợp trong thời gian sớm nhất."
      />

      <section className="public-section">
        <div className="site-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <aside>
            <SectionHeader
              eyebrow="Thông tin"
              title="Kết nối với Studio"
              description={settings.tagline}
            />

            <div className="mt-8 grid gap-4 text-sm leading-7">
              {settings.contact.phone ? (
                <ContactInfo title="Số điện thoại">
                  <a href={`tel:${settings.contact.phone}`}>
                    {settings.contact.phone}
                  </a>
                </ContactInfo>
              ) : null}
              {settings.contact.email ? (
                <ContactInfo title="Email">
                  <a href={`mailto:${settings.contact.email}`}>
                    {settings.contact.email}
                  </a>
                </ContactInfo>
              ) : null}
              {settings.contact.address ? (
                <ContactInfo title="Địa chỉ">
                  {settings.contact.address}
                </ContactInfo>
              ) : null}
            </div>

            <div className="mt-10">
              <SectionHeader eyebrow="Cơ sở" title="Không gian Studio" />
              <div className="mt-6 grid gap-4">
                {locations.length === 0 ? (
                  <p className="theme-card p-4 text-sm text-[var(--color-muted)]">
                    Chưa có cơ sở đang hiển thị.
                  </p>
                ) : null}

                {locations.map((location) => (
                  <article key={location.id} className="theme-card p-4 text-sm">
                    <h2
                      className="text-xl font-semibold"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {location.name}
                    </h2>
                    <p className="mt-2 leading-6 text-[var(--color-muted)]">
                      {location.address}
                    </p>
                    {location.phone ? (
                      <a
                        href={`tel:${location.phone}`}
                        className="mt-2 inline-flex font-extrabold text-[var(--color-primary)]"
                      >
                        {location.phone}
                      </a>
                    ) : null}
                    <div className="mt-4">
                      <Link
                        href={`/dia-diem/${location.slug}`}
                        className="theme-button-secondary"
                      >
                        Xem cơ sở
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </aside>

          <ContactForm locations={locations} />
        </div>
      </section>
    </main>
  );
}

function ContactInfo({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <p className="theme-card p-4">
      <span className="block font-extrabold text-[var(--color-text)]">
        {title}
      </span>
      <span className="text-[var(--color-muted)]">{children}</span>
    </p>
  );
}

function getCanonicalPath(path: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl).toString();
}
