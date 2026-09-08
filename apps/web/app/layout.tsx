import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getMediaAssetUrl } from "@/lib/api/client";
import { getPublicSettings } from "@/lib/api/settings";
import { getPublicTheme } from "@/lib/api/theme";
import { getSiteUrl } from "@/lib/site-url";
import { getThemeCssVariables } from "@/lib/theme";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings({ cache: "no-store" });
  const title = settings.defaultSeo.title || settings.studioName;
  const description =
    settings.defaultSeo.description ||
    settings.tagline ||
    "Dịch vụ chụp ảnh chuyên nghiệp cho những khoảnh khắc đáng nhớ.";
  const metadataBase = getSiteUrl() ?? undefined;
  const ogImage = settings.defaultSeo.ogImage;

  return {
    metadataBase,
    title,
    description,
    icons: settings.favicon
      ? [
          {
            url: getMediaAssetUrl(settings.favicon.url),
          },
        ]
      : undefined,
    openGraph: {
      title,
      description,
      siteName: settings.studioName,
      images: ogImage
        ? [
            {
              url: getMediaAssetUrl(ogImage.url),
              width: ogImage.width,
              height: ogImage.height,
              alt: ogImage.alt || settings.studioName,
            },
          ]
        : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [settings, theme] = await Promise.all([
    getPublicSettings({ cache: "no-store" }),
    getPublicTheme({ cache: "no-store" }),
  ]);

  return (
    <html lang="vi" className="h-full antialiased">
      <body
        className="site-shell flex min-h-screen flex-col"
        style={getThemeCssVariables(theme)}
      >
        <SiteHeader settings={settings} />
        <div className="flex-1">{children}</div>
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
