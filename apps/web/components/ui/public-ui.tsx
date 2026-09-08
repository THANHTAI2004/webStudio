import Link from "next/link";
import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

interface CategoryFilterItem {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  basePath: string;
  activeCategory?: string;
  items: CategoryFilterItem[];
  allLabel?: string;
}

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  previousHref: string;
  nextHref: string;
}

interface SmartLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
});

export function PageHero({
  eyebrow = "Studio",
  title,
  description,
  children,
}: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="site-container">
        <div className="page-hero__content">
          {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
          <h1 className="display-heading">{title}</h1>
          {description ? <p className="page-hero__lead">{description}</p> : null}
          {children ? <div className="page-hero__actions">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: SectionHeaderProps) {
  return (
    <header className="section-header">
      <div>
        {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
        <h2 className="section-title">{title}</h2>
        {description ? <p className="section-description">{description}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <SmartLink href={actionHref} className="theme-button-secondary">
          {actionLabel}
        </SmartLink>
      ) : null}
    </header>
  );
}

export function PublicButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <SmartLink
      href={href}
      className={
        variant === "primary" ? "theme-button-primary" : "theme-button-secondary"
      }
    >
      {children}
    </SmartLink>
  );
}

export function CategoryFilter({
  basePath,
  activeCategory,
  items,
  allLabel = "Tất cả",
}: CategoryFilterProps) {
  return (
    <nav className="category-filter" aria-label="Lọc danh mục">
      <Link
        href={basePath}
        className={`category-chip ${activeCategory ? "" : "is-active"}`}
      >
        {allLabel}
      </Link>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`${basePath}?category=${item.slug}`}
          className={`category-chip ${
            activeCategory === item.slug ? "is-active" : ""
          }`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {description ? <p className="empty-state__description">{description}</p> : null}
      {actionHref && actionLabel ? (
        <PublicButtonLink href={actionHref} variant="secondary">
          {actionLabel}
        </PublicButtonLink>
      ) : null}
    </div>
  );
}

export function PaginationControls({
  page,
  totalPages,
  previousHref,
  nextHref,
}: PaginationControlsProps) {
  const normalizedTotalPages = Math.max(totalPages, 1);
  const hasPrevious = page > 1;
  const hasNext = totalPages > 0 && page < totalPages;

  return (
    <nav className="pagination" aria-label="Phân trang">
      {hasPrevious ? (
        <Link href={previousHref} className="pagination-link">
          Trước
        </Link>
      ) : (
        <span className="pagination-link is-disabled">Trước</span>
      )}
      <span className="pagination-status">
        Trang {page} / {normalizedTotalPages}
      </span>
      {hasNext ? (
        <Link href={nextHref} className="pagination-link">
          Sau
        </Link>
      ) : (
        <span className="pagination-link is-disabled">Sau</span>
      )}
    </nav>
  );
}

export function SmartLink({ href, className, children }: SmartLinkProps) {
  const normalizedHref = href || "/";

  if (/^https?:\/\//i.test(normalizedHref)) {
    return (
      <a
        href={normalizedHref}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={normalizedHref} className={className}>
      {children}
    </Link>
  );
}
