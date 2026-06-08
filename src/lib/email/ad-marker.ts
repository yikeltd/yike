/** Marker in buildEmailLayout — replaced when sending or previewing. */
export const EMAIL_AD_MARKER = "<!-- YIKE_EMAIL_AD -->";

export const EMAIL_AD_PLACEMENT_KEY = "email_transactional" as const;

export function applyEmailAd(html: string, adHtml: string): string {
  if (!html.includes(EMAIL_AD_MARKER)) return html;
  return html.replace(EMAIL_AD_MARKER, adHtml);
}
