"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { getMediaAssetUrl } from "@/lib/api/client";
import type { PublicSettings } from "@/lib/api/settings";
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

export function SiteHeader({ settings }: { settings: PublicSettings }) {
  const pathname = usePathname();
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigation = getVisibleNavigation(settings);
  const mainNavigation = navigation.filter((item) => item.href !== "/dat-lich");
  const bookingItem = navigation.find((item) => item.href === "/dat-lich");
  const logoAlt = settings.logo?.alt || settings.studioName;
  const telHref = getTelHref(settings.contact.phone);
  const mailHref = getMailHref(settings.contact.email);
  const socialLinks = getSocialLinks(settings);
  const hasDesktopUtility =
    Boolean(settings.contact.address) || Boolean(mailHref) || Boolean(telHref);
  const isHome = pathname === "/";

  useEffect(() => {
    let animationFrame = 0;

    function handleScroll() {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 36);
        animationFrame = 0;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileCloseRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key === "Tab") {
        trapFocus(event, mobilePanelRef.current);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <header
      className={[
        "site-header",
        isHome ? "site-header--home" : "",
        isScrolled ? "site-header--scrolled" : "site-header--top",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasDesktopUtility ? (
        <div className="site-header__utility" aria-label="Thông tin liên hệ nhanh">
          <div className="site-container site-header__utility-inner">
            <div className="site-header__utility-list">
              {settings.contact.address ? (
                <Link href="/dia-diem" className="site-header__utility-item">
                  <span aria-hidden="true">⌖</span>
                  <span>{settings.contact.address}</span>
                </Link>
              ) : null}
              {mailHref ? (
                <a href={mailHref} className="site-header__utility-item">
                  <span aria-hidden="true">✉</span>
                  <span>{settings.contact.email}</span>
                </a>
              ) : null}
            </div>

            <div className="site-header__utility-actions">
              {telHref ? (
                <a href={telHref} className="site-header__utility-item">
                  <span aria-hidden="true">☎</span>
                  <span>{settings.contact.phone}</span>
                </a>
              ) : null}
              {bookingItem ? (
                <Link href={bookingItem.href} className="site-header__utility-booking">
                  {bookingItem.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="site-header__main">
        <div className="site-container site-header__inner">
          <Link
            href="/"
            className="site-header__brand"
            aria-label={`${settings.studioName} - Trang chủ`}
            onClick={() => setIsOpen(false)}
          >
            {settings.logo ? (
              <Image
                src={getMediaAssetUrl(settings.logo.url)}
                alt={logoAlt}
                width={Math.max(settings.logo.width, 1)}
                height={Math.max(settings.logo.height, 1)}
                sizes="144px"
                className="site-header__logo"
                priority
              />
            ) : (
              <span className="site-header__brand-text">
                {settings.studioName}
              </span>
            )}
          </Link>

          <nav
            aria-label="Điều hướng chính"
            className="site-header__desktop-nav"
          >
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActivePath(pathname, item.href) ? "is-active" : ""}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="site-header__actions">
            {bookingItem ? (
              <Link href={bookingItem.href} className="site-header__cta">
                <span>{bookingItem.label}</span>
                <span aria-hidden="true" className="site-header__cta-arrow">
                  →
                </span>
              </Link>
            ) : null}

            <button
              type="button"
              className={`site-header__menu-button ${isOpen ? "is-open" : ""}`}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              aria-label={isOpen ? "Đóng menu" : "Mở menu"}
              onClick={() => setIsOpen((current) => !current)}
            >
              <span className="site-header__menu-lines" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span>Menu</span>
            </button>
          </div>
        </div>
      </div>

      {isOpen ? (
        <div className="site-header__mobile-layer">
          <button
            type="button"
            className="site-header__mobile-overlay"
            aria-label="Đóng menu"
            tabIndex={-1}
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={mobilePanelRef}
            id="mobile-navigation"
            className="site-header__mobile-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
          >
            <div className="site-header__mobile-head">
              <Link
                href="/"
                className="site-header__mobile-brand"
                onClick={() => setIsOpen(false)}
              >
                {settings.logo ? (
                  <Image
                    src={getMediaAssetUrl(settings.logo.url)}
                    alt={logoAlt}
                    width={Math.max(settings.logo.width, 1)}
                    height={Math.max(settings.logo.height, 1)}
                    sizes="120px"
                    className="site-header__mobile-logo"
                  />
                ) : (
                  <span>{settings.studioName}</span>
                )}
              </Link>
              <button
                ref={mobileCloseRef}
                type="button"
                className="site-header__mobile-close"
                aria-label="Đóng menu"
                onClick={() => setIsOpen(false)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <nav
              aria-label="Điều hướng di động"
              className="site-header__mobile-nav"
            >
              {mainNavigation.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActivePath(pathname, item.href) ? "is-active" : ""}
                  style={{ "--nav-index": index } as CSSProperties}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {bookingItem ? (
              <Link
                href={bookingItem.href}
                className="site-header__mobile-cta"
                onClick={() => setIsOpen(false)}
              >
                <span>Đặt lịch ngay</span>
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}

            {telHref || mailHref ? (
              <div className="site-header__mobile-contact">
                <p>Liên hệ</p>
                {telHref ? <a href={telHref}>{settings.contact.phone}</a> : null}
                {mailHref ? (
                  <a href={mailHref}>{settings.contact.email}</a>
                ) : null}
              </div>
            ) : null}

            {socialLinks.length > 0 ? (
              <div className="site-header__mobile-socials">
                {socialLinks.map(({ key, href }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={socialLabels[key]}
                  >
                    {socialShortLabels[key]}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function getTelHref(phone: string): string | null {
  const normalized = phone.trim().replace(/[^\d+]/g, "");

  return normalized ? `tel:${normalized}` : null;
}

function getMailHref(email: string): string | null {
  const normalized = email.trim();

  return normalized ? `mailto:${normalized}` : null;
}

function getSocialLinks(settings: PublicSettings) {
  return Object.entries(settings.socials)
    .filter(
      (entry): entry is [SocialKey, string] =>
        Boolean(entry[1]) && entry[1].trim().length > 0,
    )
    .map(([key, href]) => ({ key, href }));
}

function trapFocus(event: KeyboardEvent, container: HTMLElement | null) {
  if (!container) {
    return;
  }

  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );

  if (focusableElements.length === 0) {
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
