import { SITE_URL } from "@/lib/constants";

/** Escape user-supplied text for HTML email bodies. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Point email image assets at a preview origin (e.g. localhost) without changing CTA links. */
export function withEmailAssetOrigin(html: string, origin: string): string {
  const base = origin.replace(/\/$/, "");
  if (base === SITE_URL.replace(/\/$/, "")) return html;

  return html
    .replaceAll(`${SITE_URL}/email/social/`, `${base}/email/social/`)
    .replaceAll(`${SITE_URL}/email/badges/`, `${base}/email/badges/`)
    .replaceAll(`${SITE_URL}/images/`, `${base}/images/`)
    .replaceAll(`${SITE_URL}/icons/`, `${base}/icons/`);
}
