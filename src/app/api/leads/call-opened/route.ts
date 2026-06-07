import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logLeadEvent } from "@/lib/leads/events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const yikeReference = String(body.yikeReference ?? "").trim();
  if (!yikeReference) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true });
  }

  const now = new Date().toISOString();
  const { data: lead } = await admin
    .from("leads")
    .update({ call_opened_at: now })
    .eq("yike_reference", yikeReference)
    .is("call_opened_at", null)
    .select("id")
    .maybeSingle();

  if (lead?.id) {
    await logLeadEvent({ leadId: lead.id as string, type: "call_opened" });
  }

  return NextResponse.json({ ok: true });
}
