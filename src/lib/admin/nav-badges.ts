import { requireServerClient } from "@/lib/supabase/require-client";
import { OPEN_REPORT_STATUSES } from "@/lib/constants";
import type { AdminNavBadges } from "@/lib/admin/navigation";

type CountResult = { count: number | null; error: { message: string } | null };

async function safeCount(
  promise: PromiseLike<CountResult>,
  label: string
): Promise<number> {
  try {
    const { count, error } = await promise;
    if (error) {
      console.error(`[nav-badges] ${label}:`, error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error(`[nav-badges] ${label}:`, err);
    return 0;
  }
}

/** Urgent counts only — never throw; missing tables must not break Lex SSR. */
export async function fetchAdminNavBadges(): Promise<AdminNavBadges> {
  try {
    const supabase = await requireServerClient();
    const now = new Date().toISOString();
    const inThreeDays = new Date(Date.now() + 3 * 86_400_000).toISOString();

    const [
      pending,
      reports,
      dupes,
      expiring,
      pricing,
      trust,
    ] = await Promise.all([
      safeCount(
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        "pending"
      ),
      safeCount(
        supabase
          .from("listing_reports")
          .select("id", { count: "exact", head: true })
          .in("status", [...OPEN_REPORT_STATUSES]),
        "reports"
      ),
      safeCount(
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("possible_duplicate", true)
          .gte("duplicate_confidence_score", 0.65),
        "duplicates"
      ),
      safeCount(
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved")
          .gt("expires_at", now)
          .lte("expires_at", inThreeDays),
        "expiring"
      ),
      safeCount(
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .in("price_review_status", ["admin_review", "needs_confirmation"]),
        "pricing"
      ),
      safeCount(
        supabase
          .from("trust_review_cases")
          .select("id", { count: "exact", head: true })
          .in("status", ["open", "in_review"]),
        "trust"
      ),
    ]);

    const badges: AdminNavBadges = {};
    if (pending > 0) badges["pending-reviews"] = pending;
    if (reports > 0) badges["open-reports"] = reports;
    if (dupes > 0) badges["duplicate-flags"] = dupes;
    if (expiring > 0) badges["expiring-listings"] = expiring;
    if (pricing > 0) badges["pricing-warnings"] = pricing;
    if (trust > 0) badges["trust-queue"] = trust;
    return badges;
  } catch (err) {
    console.error("[nav-badges] fatal:", err);
    return {};
  }
}
