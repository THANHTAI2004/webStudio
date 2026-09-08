"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getMediaAssetUrl } from "@/lib/api/client";
import type { PublicSettings } from "@/lib/api/settings";
import { getVisibleNavigation } from "./navigation";

export function SiteHeader({ settings }: { settings: PublicSettings }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navigation = getVisibleNavigation(settings);
  const logoAlt = settings.logo?.alt || settings.studioName;

  return (
    <header className="site-header">
      <div className="site-container site-header__inner">
        <Link
          href="/"
          className="site-header__brand"
          onClick={() => setIsOpen(false)}
        >
          {settings.logo ? (
            <Image
              src={getMediaAssetUrl(settings.logo.url)}
              alt={logoAlt}
              width={Math.max(settings.logo.width, 1)}
              height={Math.max(settings.logo.height, 1)}
              sizes="120px"
              className="site-header__logo"
              priority
            />
          ) : null}
          <span className="site-header__brand-text">
            <span>{settings.studioName}</span>
            {settings.tagline ? <small>{settings.tagline}</small> : null}
          </span>
        </Link>

        <nav aria-label="Main navigation" className="site-header__desktop-nav">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActivePath(pathname, item.href) ? "is-active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="site-header__menu-button"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
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

      {isOpen ? (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="site-header__mobile-nav"
        >
          <div className="site-container">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActivePath(pathname, item.href) ? "is-active" : ""}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
