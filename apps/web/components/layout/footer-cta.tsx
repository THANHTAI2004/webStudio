"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PublicSettings } from "@/lib/api/settings";

export function FooterCta({ settings }: { settings: PublicSettings }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  const primaryHref = settings.navigation.showBooking
    ? "/dat-lich"
    : settings.navigation.showContact
      ? "/lien-he"
      : null;

  if (!primaryHref) {
    return null;
  }

  const primaryLabel =
    primaryHref === "/dat-lich" ? "Đặt lịch ngay" : "Liên hệ tư vấn";
  const description =
    settings.footer.description ||
    settings.tagline ||
    "Chia sẻ với Studio câu chuyện của bạn, chúng tôi sẽ giúp bạn lưu lại bằng những khung hình đẹp nhất.";

  return (
    <section className="footer-cta" aria-labelledby="footer-cta-title">
      <div className="site-container footer-cta__inner">
        <div>
          <p className="footer-cta__eyebrow">Bạn đã sẵn sàng?</p>
          <h2 id="footer-cta-title">Lưu giữ những khoảnh khắc đáng nhớ</h2>
          <p>{description}</p>
        </div>
        <div className="footer-cta__actions">
          <Link href={primaryHref} className="footer-cta__primary">
            <span>{primaryLabel}</span>
            <span aria-hidden="true">→</span>
          </Link>
          {settings.navigation.showContact && primaryHref !== "/lien-he" ? (
            <Link href="/lien-he" className="footer-cta__secondary">
              Liên hệ tư vấn
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
