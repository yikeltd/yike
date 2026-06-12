import type { Profile } from "@/types/database";
import { isAgentRole } from "@/lib/agent-tiers";
import { shouldShowTrustCenter } from "@/lib/verification/trust-center";

export type SellerDashboardContextInput = {
  canList: boolean;
  totalListings: number;
};

/** True when the user is in a seller/lister context — not a browse-only buyer. */
export function hasSellerDashboardContext(
  profile: Profile,
  ctx: SellerDashboardContextInput
): boolean {
  if (ctx.canList || isAgentRole(profile.role)) return true;
  if (ctx.totalListings > 0) return true;
  if (profile.listing_rules_accepted_at) return true;
  return false;
}

export function shouldShowTrustCenterOnDashboard(
  profile: Profile,
  verified: boolean,
  ctx: SellerDashboardContextInput
): boolean {
  if (!hasSellerDashboardContext(profile, ctx)) return false;
  return shouldShowTrustCenter(profile, verified);
}
