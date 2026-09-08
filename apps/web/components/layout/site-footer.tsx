import Link from "next/link";
import type { PublicSettings } from "@/lib/api/settings";
import { getVisibleNavigation } from "./navigation";

const socialLabels: Record<keyof PublicSettings["socials"], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  zalo: "Zalo",
};

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const navigation = getVisibleNavigation(settings);
  const socialLinks = Object.entries(settings.socials).filter(
    (entry): entry is [keyof PublicSettings["socials"], string] =>
      Boolean(entry[1]),
  );
  const copyright =
    settings.footer.copyrightText ||
    `\u00a9 ${new Date().getFullYear()} ${settings.studioName}.`;

  return (
    <footer className="site-footer">
      <div className="site-container site-footer__grid">
        <div>
          <h2>{settings.studioName}</h2>
          {settings.footer.description ? (
            <p>{settings.footer.description}</p>
          ) : null}
        </div>

        <div>
          <h3>Contact</h3>
          <ul>
            {settings.contact.phone ? (
              <li>
                <a href={`tel:${settings.contact.phone}`}>
                  {settings.contact.phone}
                </a>
              </li>
            ) : null}
            {settings.contact.email ? (
              <li>
                <a href={`mailto:${settings.contact.email}`}>
                  {settings.contact.email}
                </a>
              </li>
            ) : null}
            {settings.contact.address ? <li>{settings.contact.address}</li> : null}
          </ul>
        </div>

        <div>
          <h3>Navigation</h3>
          <ul>
            {navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {socialLinks.length > 0 ? (
          <div>
            <h3>Social</h3>
            <ul>
              {socialLinks.map(([key, href]) => (
                <li key={key}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {socialLabels[key]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="site-container site-footer__bottom">{copyright}</div>
    </footer>
  );
}
