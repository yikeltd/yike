import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function getVerifierForUser(userId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("field_verifiers")
    .select("id, status")
    .eq("profile_id", userId)
    .maybeSingle();
  return data;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const verifier = await getVerifierForUser(user.id);
  if (!verifier || verifier.status !== "approved") {
    return NextResponse.json({ error: "Not an active verifier" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const requestId = String(body.requestId ?? "").trim();

  if (action !== "accept" || !requestId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: row } = await admin
    .from("property_verification_requests")
    .select("id, assigned_verifier_id, status")
    .eq("id", requestId)
    .single();

  if (!row || row.assigned_verifier_id !== verifier.id) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (row.status !== "assigned") {
    return NextResponse.json({ error: "Assignment cannot be accepted in current status" }, { status: 409 });
  }

  const now = new Date().toISOString();
  await admin
    .from("property_verification_requests")
    .update({ status: "accepted", accepted_at: now, updated_at: now })
    .eq("id", requestId);

  return NextResponse.json({ ok: true });
}
