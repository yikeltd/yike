import {
  ADMIN_BASE_PATH,
  adminPath,
  SUPPORT_BASE_PATH,
  TECH_BASE_PATH,
} from "@/lib/admin-paths";

/** Canonical work areas chief admins can assign to staff. */
export const STAFF_WORK_AREAS = [
  "command_center",
  "support",
  "listing_review",
  "trust_review",
  "verification",
  "ambassadors",
  "legal_partners",
  "deal_matching",
  "tech",
] as const;

export type StaffWorkArea = (typeof STAFF_WORK_AREAS)[number];

export const STAFF_WORK_AREA_LABELS: Record<StaffWorkArea, string> = {
  command_center: "Command Center",
  support: "Support",
  listing_review: "Listing Review",
  trust_review: "Trust Review",
  verification: "Property Verification",
  ambassadors: "Ambassadors",
  legal_partners: "Legal Partners",
  deal_matching: "Deal Matching",
  tech: "Tech Ops",
};

export const STAFF_ROOM_PATHS: Record<StaffWorkArea, string> = {
  command_center: `${ADMIN_BASE_PATH}/overview`,
  support: SUPPORT_BASE_PATH,
  listing_review: adminPath("listings/review"),
  trust_review: adminPath("trust-review-queue"),
  verification: adminPath("property-verifications"),
  ambassadors: adminPath("ambassadors"),
  legal_partners: adminPath("legal-partners"),
  deal_matching: adminPath("deal-matching"),
  tech: TECH_BASE_PATH,
};

export function workAreaConsole(
  area: StaffWorkArea
): "auth" | "support" | "tech" {
  if (area === "support") return "support";
  if (area === "tech") return "tech";
  return "auth";
}

/** Map free-text responsibilities from staff_profiles to work areas. */
export function responsibilitiesToWorkAreas(
  responsibilities: string[] | null | undefined
): StaffWorkArea[] {
  if (!responsibilities?.length) return [];

  const out = new Set<StaffWorkArea>();
  for (const raw of responsibilities) {
    const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
    if ((STAFF_WORK_AREAS as readonly string[]).includes(key)) {
      out.add(key as StaffWorkArea);
      continue;
    }
    if (key.includes("listing") || key.includes("review")) out.add("listing_review");
    if (key.includes("trust")) out.add("trust_review");
    if (key.includes("support")) out.add("support");
    if (key.includes("verif")) out.add("verification");
    if (key.includes("ambassador")) out.add("ambassadors");
    if (key.includes("legal")) out.add("legal_partners");
    if (key.includes("deal")) out.add("deal_matching");
    if (key.includes("tech")) out.add("tech");
  }
  return [...out];
}
