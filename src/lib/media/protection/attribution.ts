/**
 * Dynamic watermark attribution — company → seller name → Verified Seller.
 */

export type AttributionProfile = {
  full_name?: string | null;
  company_name?: string | null;
};

function cleanLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  // Keep watermark readable on mobile screenshots
  return trimmed.length > 42 ? `${trimmed.slice(0, 40)}…` : trimmed;
}

export function resolveWatermarkAttribution(profile: AttributionProfile): {
  sellerName: string | null;
  companyName: string | null;
  attribution: string;
  watermarkLabel: string;
} {
  const companyName = cleanLabel(profile.company_name);
  const sellerName = cleanLabel(profile.full_name);
  const attribution = companyName || sellerName || "Verified Seller";
  return {
    sellerName,
    companyName,
    attribution,
    watermarkLabel: `${attribution} • Yike.ng`,
  };
}
