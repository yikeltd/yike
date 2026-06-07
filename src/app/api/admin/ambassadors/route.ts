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

  if (tab === "slots") {
    const { data } = await admin
      .from("city_ambassador_slots")
      .select("*")
      .order("city");
    return NextResponse.json({ slots: data ?? [] });
  }

  if (tab === "commissions") {
    const { data } = await admin
      .from("ambassador_commissions")
      .select(
        "*, city_ambassadors!inner(ambassador_code, assigned_city, assigned_state)"
      )
      .order("created_at", { ascending: false })
      .limit(80);
    return NextResponse.json({ commissions: data ?? [] });
  }

  if (tab === "payouts") {
    const { data } = await admin
      .from("ambassador_payouts")
      .select(
        "*, city_ambassadors!inner(ambassador_code, assigned_city, profile_id)"
      )
      .order("created_at", { ascending: false })
      .limit(60);
    return NextResponse.json({ payouts: data ?? [] });
  }

  if (tab === "approved") {
    const { data } = await admin
      .from("city_ambassadors")
      .select("*")
      .in("status", ["approved", "paused", "inactive"])
      .order("approved_at", { ascending: false });
    return NextResponse.json({ ambassadors: data ?? [] });
  }

  const status = url.searchParams.get("status");
  let query = admin
    .from("ambassador_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  if (status) query = query.eq("status", status);

  const { data } = await query;
  return NextResponse.json({ applications: data ?? [] });
}
