import type { SupabaseClient } from "@supabase/supabase-js";
import { revokeTrustBadge } from "@/lib/trust/operations/badges";

export function formatReportValidityNotice(validUntil: string | null | undefined): string {
  if (!validUntil) return "";
  const date = new Date(validUntil).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `\n\nReport validity: This inspection summary reflects conditions as of the visit date and remains indicative until ${date}. Property conditions can change — buyer due diligence is still encouraged.`;
}

export async function expireStaleVerificationReports(
  admin: SupabaseClient,
  limit = 50
): Promise<number> {
  const now = new Date().toISOString();

  const { data: reports } = await admin
    .from("property_verification_reports")
    .select("id, verification_request_id, report_valid_until")
    .eq("admin_review_status", "approved")
    .lt("report_valid_until", now)
    .limit(limit);

  if (!reports?.length) return 0;

  let expired = 0;
  for (const report of reports) {
    await admin
      .from("property_verification_reports")
      .update({ admin_review_status: "expired" })
      .eq("id", report.id);

    const { data: request } = await admin
      .from("property_verification_requests")
      .select("id, property_id, request_reference")
      .eq("id", report.verification_request_id)
      .maybeSingle();

    if (request?.property_id) {
      await revokeTrustBadge(
        admin,
        {
          entityType: "property",
          entityId: request.property_id as string,
          badgeType: "physically_reviewed",
        },
        "Verification report validity expired"
      );

      await admin
        .from("properties")
        .update({
          internal_trust_status: "normal",
          updated_at: now,
        })
        .eq("id", request.property_id)
        .eq("internal_trust_status", "physically_reviewed");
    }

    expired++;
  }

  return expired;
}
