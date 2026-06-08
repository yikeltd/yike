import { requireServerClient } from "@/lib/supabase/require-client";
import { OPEN_REPORT_STATUSES } from "@/lib/constants";
import type { AdminNavBadges } from "@/lib/admin/navigation";

/** Urgent counts only — avoid badge spam. */
export async function fetchAdminNavBadges(): Promise<AdminNavBadges> {
  const supabase = await requireServerClient();
  const now = new Date().toISOString();
  const inThreeDays = new Date(Date.now() + 3 * 86_400_000).toISOString();

  const [
    pendingReviews,
    openReports,
    duplicateFlags,
    expiringSoon,
    pricingWarnings,
    trustQueue,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("listing_reports")
      .select("*", { count: "exact", head: true })
      .in("status", [...OPEN_REPORT_STATUSES]),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("possible_duplicate", true)
      .gte("duplicate_confidence_score", 0.65),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gt("expires_at", now)
      .lte("expires_at", inThreeDays),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .in("price_review_status", ["admin_review", "needs_confirmation"]),
    supabase
      .from("trust_review_cases")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_review"]),
  ]);

  const badges: AdminNavBadges = {};
  const pending = pendingReviews.count ?? 0;
  if (pending > 0) badges["pending-reviews"] = pending;

  const reports = openReports.count ?? 0;
  if (reports > 0) badges["open-reports"] = reports;

  const dupes = duplicateFlags.count ?? 0;
  if (dupes > 0) badges["duplicate-flags"] = dupes;

  const expiring = expiringSoon.count ?? 0;
  if (expiring > 0) badges["expiring-listings"] = expiring;

  const pricing = pricingWarnings.count ?? 0;
  if (pricing > 0) badges["pricing-warnings"] = pricing;

  const trust = trustQueue.count ?? 0;
  if (trust > 0) badges["trust-queue"] = trust;

  return badges;
}
