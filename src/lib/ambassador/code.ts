import { AMBASSADOR_CODE_PREFIX } from "./constants";

function randomSegment(length = 5): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generateAmbassadorCode(): string {
  return `${AMBASSADOR_CODE_PREFIX}-${randomSegment(5)}`;
}

export function ambassadorSlugFromName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return base || "ambassador";
}

export function ambassadorReferralUrl(code: string, siteUrl?: string): string {
  const base = (siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://yike.ng").replace(
    /\/$/,
    ""
  );
  return `${base}/auth/signup?ref=${encodeURIComponent(code)}`;
}
