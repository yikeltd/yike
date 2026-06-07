import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data } = await admin
    .from("staff_ops_alerts")
    .select("*")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(40);

  return NextResponse.json({ alerts: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const alertId = String(body.alertId ?? "").trim();
  if (!alertId) return NextResponse.json({ error: "alertId required" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  await admin
    .from("staff_ops_alerts")
    .update({ read_at: new Date().toISOString() })
    .eq("id", alertId);

  return NextResponse.json({ ok: true });
}
