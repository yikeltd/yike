import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: partner } = await admin
    .from("legal_partners")
    .select("id, status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!partner || partner.status !== "approved") {
    return NextResponse.json({ error: "Not an active legal partner" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.action !== "accept" || !body.requestId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: row } = await admin
    .from("legal_verification_requests")
    .select("id, assigned_legal_partner_id, status")
    .eq("id", body.requestId)
    .single();

  if (!row || row.assigned_legal_partner_id !== partner.id) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (row.status !== "assigned") {
    return NextResponse.json({ error: "Cannot accept in current status" }, { status: 409 });
  }

  const now = new Date().toISOString();
  await admin
    .from("legal_verification_requests")
    .update({ status: "in_progress", updated_at: now })
    .eq("id", body.requestId);

  return NextResponse.json({ ok: true });
}
