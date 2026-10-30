/** Shared public footer copy and link groups — single source for SiteFooter + tests. */

import { SELLER_CHOOSE_LISTING_PATH } from "@/lib/seller-trust";

export const FOOTER_TAGLINE =
  "Nigeria's trusted marketplace for property, vehicles, and electronics." as const;

export const FOOTER_SAFETY_DISCLAIMER =
  "Yike is a marketplace for property, vehicles, and electronics. Always inspect listings and complete your due diligence before making payments." as const;

export const FOOTER_OWNERSHIP_LINE = "Owned & Operated by Yike Ltd." as const;

export const FOOTER_COMPANY_RC = "RC-9552998" as const;

export const FOOTER_EXPLORE_LINKS = [
  { href: "/buy", label: "Buy Property" },
  { href: "/rent", label: "Rent Property" },
  { href: "/vehicles", label: "Vehicles", vehiclesOnly: true as const },
  { href: "/electronics", label: "Electronics", electronicsOnly: true as const },
  { href: SELLER_CHOOSE_LISTING_PATH, label: "Sell on Yike" },
] as const;

export const FOOTER_COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/safety", label: "Safety Centre" },
  { href: "/verify-agent", label: "Become Verified" },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
] as const;

export function footerCopyrightLine(year: number): string {
  return `© ${year} Yike Ltd. All rights reserved. ${FOOTER_COMPANY_RC}`;
}
