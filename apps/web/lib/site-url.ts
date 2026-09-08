export function getSiteUrl(): URL | null {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!rawSiteUrl) {
    return null;
  }

  try {
    return new URL(rawSiteUrl);
  } catch {
    return null;
  }
}

export function getCanonicalUrl(path: string): string | undefined {
  const siteUrl = getSiteUrl();

  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl).toString();
}
