import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") ?? "applications";

  if (tab === "approved" || tab === "inactive" || tab === "fraud_review") {
    const statuses =
      tab === "approved"
        ? ["approved", "paused"]
        : tab === "inactive"
          ? ["inactive", "suspended"]
          : ["fraud_review"];
    const { data } = await admin
      .from("legal_partners")
      .select("*")
      .in("status", statuses)
      .order("approved_at", { ascending: false, nullsFirst: false });
    return NextResponse.json({ partners: data ?? [] });
  }

  if (tab === "pending" || tab === "assignments" || tab === "reviews") {
    const statusFilter =
      tab === "pending"
        ? ["submitted", "contacted", "awaiting_documents", "under_review", "awaiting_assignment"]
        : tab === "assignments"
          ? ["assigned", "in_progress"]
          : ["completed", "reviewed"];
    const { data } = await admin
      .from("legal_verification_requests")
      .select(
        "*, legal_partners(id, partner_code, full_name, firm_name), properties(id, title, city, area)"
      )
      .in("status", statusFilter)
      .order("requested_at", { ascending: false })
      .limit(80);
    return NextResponse.json({ requests: data ?? [] });
  }

  if (tab === "reports") {
    const { data } = await admin
      .from("legal_verification_reports")
      .select(
        "*, legal_verification_requests(id, request_reference, property_title, property_location_text, status), legal_partners(partner_code, full_name, firm_name)"
      )
      .eq("admin_review_status", "pending")
      .order("submitted_at", { ascending: false })
      .limit(60);
    return NextResponse.json({ reports: data ?? [] });
  }

  if (tab === "payouts") {
    const { data } = await admin
      .from("legal_partner_payouts")
      .select("*, legal_partners(partner_code, full_name, email, firm_name)")
      .order("created_at", { ascending: false })
      .limit(40);
    return NextResponse.json({ payouts: data ?? [] });
  }

  const { data } = await admin
    .from("legal_partner_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  return NextResponse.json({ applications: data ?? [] });
}
