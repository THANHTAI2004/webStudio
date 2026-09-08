const DEVELOPMENT_SITE_URL = 'http://localhost:3000';

export function getPublicUrl(path: string): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallbackSiteUrl =
    process.env.NODE_ENV === 'production' ? undefined : DEVELOPMENT_SITE_URL;
  const siteUrl = configuredSiteUrl || fallbackSiteUrl;

  if (!siteUrl) {
    return path;
  }

  try {
    return new URL(path, siteUrl).toString();
  } catch {
    return path;
  }
}
