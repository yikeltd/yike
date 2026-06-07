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
      .from("field_verifiers")
      .select("*")
      .in("status", statuses)
      .order("approved_at", { ascending: false, nullsFirst: false });
    return NextResponse.json({ verifiers: data ?? [] });
  }

  if (tab === "pending" || tab === "assignments") {
    const statusFilter =
      tab === "pending"
        ? ["awaiting_assignment", "pending"]
        : ["assigned", "accepted", "in_progress"];
    const { data } = await admin
      .from("property_verification_requests")
      .select(
        "*, properties(id, title, city, area), field_verifiers(id, verifier_code, full_name)"
      )
      .in("status", statusFilter)
      .order("requested_at", { ascending: false })
      .limit(80);
    return NextResponse.json({ requests: data ?? [] });
  }

  if (tab === "reports") {
    const { data } = await admin
      .from("property_verification_reports")
      .select(
        "*, property_verification_requests(id, property_id, status, properties(title, city)), field_verifiers(verifier_code, full_name)"
      )
      .eq("admin_review_status", "pending")
      .order("submitted_at", { ascending: false })
      .limit(60);
    return NextResponse.json({ reports: data ?? [] });
  }

  if (tab === "payouts") {
    const { data } = await admin
      .from("field_verifier_payouts")
      .select("*, field_verifiers(verifier_code, full_name, email)")
      .order("created_at", { ascending: false })
      .limit(40);
    return NextResponse.json({ payouts: data ?? [] });
  }

  const { data } = await admin
    .from("field_verifier_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  return NextResponse.json({ applications: data ?? [] });
}
