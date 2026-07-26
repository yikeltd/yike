import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/admin/payments/webhooks
 * Staff: Paystack webhook event audit log.
 */
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
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);

  let query = admin
    .from("paystack_webhook_events")
    .select(
      "id, event_id, event_type, reference, status, error_message, processed_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (q) {
    query = query.or(`reference.ilike.%${q}%,event_id.ilike.%${q}%,event_type.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, events: data ?? [] });
}
