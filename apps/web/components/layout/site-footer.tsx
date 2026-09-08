import Image from "next/image";
import Link from "next/link";
import { getMediaAssetUrl } from "@/lib/api/client";
import type { PublicSettings } from "@/lib/api/settings";
import { BackToTop } from "./back-to-top";
import { FooterCta } from "./footer-cta";
import { getVisibleNavigation } from "./navigation";

type SocialKey = keyof PublicSettings["socials"];

const socialLabels: Record<SocialKey, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  zalo: "Zalo",
};

const socialShortLabels: Record<SocialKey, string> = {
  facebook: "Fb",
  instagram: "Ig",
  tiktok: "Tk",
  youtube: "Yt",
  zalo: "Za",
};

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const navigation = getVisibleNavigation(settings).filter(
    (item) => item.href !== "/dat-lich" && item.href !== "/lien-he",
  );
  const showBooking = settings.navigation.showBooking;
  const socialLinks = getSocialLinks(settings);
  const contactItems = getContactItems(settings);
  const copyright =
    settings.footer.copyrightText ||
    `© ${new Date().getFullYear()} ${settings.studioName}. Giữ toàn quyền.`;
  const footerDescription =
    settings.footer.description || settings.tagline || undefined;
  const showWatermark = settings.studioName.length <= 24;

  return (
    <>
      <FooterCta settings={settings} />
      <footer className="site-footer">
        <div className="site-footer__line" aria-hidden="true" />
        {showWatermark ? (
          <span className="site-footer__watermark" aria-hidden="true">
            {settings.studioName}
          </span>
        ) : null}
        <div className="site-container site-footer__grid">
          <div className="site-footer__brand-column">
            <Link href="/" className="site-footer__brand">
              {settings.logo ? (
                <Image
                  src={getMediaAssetUrl(settings.logo.url)}
                  alt={settings.logo.alt || settings.studioName}
                  width={Math.max(settings.logo.width, 1)}
                  height={Math.max(settings.logo.height, 1)}
                  sizes="160px"
                  className="site-footer__logo"
                />
              ) : (
                <span>{settings.studioName}</span>
              )}
            </Link>
            {footerDescription ? <p>{footerDescription}</p> : null}
          </div>

          {navigation.length > 0 ? (
            <div>
              <h3>Khám phá</h3>
              <ul className="site-footer__links">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {contactItems.length > 0 || showBooking ? (
            <div>
              <h3>Liên hệ</h3>
              {contactItems.length > 0 ? (
                <ul className="site-footer__contact">
                  {contactItems.map((item) => (
                    <li key={item.label}>
                      <span aria-hidden="true" className="site-footer__contact-icon">
                        {item.icon}
                      </span>
                      {item.href ? (
                        <a href={item.href}>{item.label}</a>
                      ) : (
                        <span>{item.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
              {showBooking ? (
                <Link href="/dat-lich" className="site-footer__small-cta">
                  Đặt lịch
                </Link>
              ) : null}
            </div>
          ) : null}

          {socialLinks.length > 0 ? (
            <div>
              <h3>Kết nối</h3>
              <div className="site-footer__socials">
                {socialLinks.map(({ key, href }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={socialLabels[key]}
                  >
                    <span aria-hidden="true">{socialShortLabels[key]}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="site-container site-footer__bottom">
          <span>{copyright}</span>
          <span>Thiết kế với sự chỉn chu cho từng khoảnh khắc.</span>
        </div>
      </footer>
      <BackToTop />
    </>
  );
}

function getSocialLinks(settings: PublicSettings) {
  return Object.entries(settings.socials)
    .filter(
      (entry): entry is [SocialKey, string] =>
        Boolean(entry[1]) && entry[1].trim().length > 0,
    )
    .map(([key, href]) => ({ key, href }));
}

function getContactItems(settings: PublicSettings) {
  const phone = settings.contact.phone.trim();
  const email = settings.contact.email.trim();
  const address = settings.contact.address.trim();

  return [
    phone
      ? {
          icon: "☎",
          label: phone,
          href: `tel:${phone.replace(/[^\d+]/g, "")}`,
        }
      : null,
    email
      ? {
          icon: "✉",
          label: email,
          href: `mailto:${email}`,
        }
      : null,
    address
      ? {
          icon: "⌖",
          label: address,
          href: settings.navigation.showLocations ? "/dia-diem" : "",
        }
      : null,
  ].filter(
    (item): item is { icon: string; label: string; href: string } =>
      item !== null,
  );
}
