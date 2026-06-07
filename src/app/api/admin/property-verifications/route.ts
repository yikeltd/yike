import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_QUEUE_TABS } from "@/lib/verification/constants";

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
  const tab = url.searchParams.get("tab") ?? "submitted";
  const ref = url.searchParams.get("ref")?.trim();

  const tabDef = ADMIN_QUEUE_TABS.find((t) => t.id === tab) ?? ADMIN_QUEUE_TABS[0];

  let query = admin
    .from("property_verification_requests")
    .select(
      "id, request_reference, status, priority, buyer_full_name, buyer_email, buyer_whatsapp, property_title, property_location_text, property_type, is_diaspora_request, requested_at, assigned_verifier_id, admin_internal_notes, concern_flags, buyer_context, verification_needs"
    )
    .in("status", [...tabDef.statuses])
    .order("requested_at", { ascending: false })
    .limit(80);

  if (ref) {
    query = admin
      .from("property_verification_requests")
      .select(
        "id, request_reference, status, priority, buyer_full_name, buyer_email, buyer_whatsapp, property_title, property_location_text, property_type, is_diaspora_request, requested_at, assigned_verifier_id, admin_internal_notes, concern_flags, buyer_context, verification_needs"
      )
      .eq("request_reference", ref)
      .limit(1);
  }

  const { data } = await query;

  const { count: alertCount } = await admin
    .from("staff_ops_alerts")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .eq("alert_type", "property_verification_new");

  return NextResponse.json({
    requests: data ?? [],
    tabs: ADMIN_QUEUE_TABS.map((t) => ({ id: t.id, label: t.label })),
    unreadAlerts: alertCount ?? 0,
  });
}
