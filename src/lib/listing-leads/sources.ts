import type { LeadSource } from "@/lib/listing-leads/constants";

export function inferLeadSource(input: {
  sourcePage?: string | null;
  placement?: string | null;
  isFeatured?: boolean;
  isBoosted?: boolean;
  profilePage?: "agency" | "developer" | null;
}): LeadSource {
  if (input.profilePage === "agency") return "agency_profile";
  if (input.profilePage === "developer") return "developer_profile";
  if (input.isFeatured || input.placement?.includes("featured")) return "featured";
  if (input.isBoosted || input.placement?.includes("boost")) return "boosted";

  const page = (input.sourcePage ?? "").toLowerCase();
  if (page.includes("/search") || page.includes("search")) return "search";
  if (page === "/" || page.includes("home") || page.includes("swipe")) return "homepage";
  if (page.includes("utm") || page.includes("share") || page.includes("social")) {
    return "social";
  }
  if (page.includes("/agents/") || page.includes("/properties/")) return "direct_link";

  return "other";
}
