import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  parseSensitiveConfirmationToken,
  requireSensitiveConfirmation,
} from "@/lib/auth/require-sensitive-confirmation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: amb } = await admin
    .from("city_ambassadors")
    .select(
      "full_name, email, whatsapp_number, phone_number, gender, date_of_birth, residential_address, residential_city, residential_state, country, nearest_landmark, assigned_city, assigned_state, identity_verification_level, nin_verified, verification_status, payout_enabled, payout_hold_reason, bank_change_pending_review"
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!amb) return NextResponse.json({ error: "Not an ambassador" }, { status: 403 });

  return NextResponse.json({ profile: amb });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const gate = requireSensitiveConfirmation(
    parseSensitiveConfirmationToken(body as Record<string, unknown>),
    user.id,
    "change_identity"
  );
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  const residentialAddress = String(body.residentialAddress ?? "").trim();
  const residentialCity = String(body.residentialCity ?? "").trim();
  const residentialState = String(body.residentialState ?? "").trim();
  const nearestLandmark = String(body.nearestLandmark ?? "").trim() || null;
  const phoneNumber = String(body.phoneNumber ?? "").trim() || null;
  const whatsappNumber = String(body.whatsappNumber ?? "").trim() || null;

  if (!residentialAddress || !residentialCity || !residentialState) {
    return NextResponse.json({ error: "Address, city, and state are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: amb } = await admin
    .from("city_ambassadors")
    .select("id, verification_status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!amb) return NextResponse.json({ error: "Not an ambassador" }, { status: 403 });

  const now = new Date().toISOString();
  const verificationStatus =
    amb.verification_status === "pending_basic" ? "basic_complete" : amb.verification_status;

  await admin
    .from("city_ambassadors")
    .update({
      residential_address: residentialAddress,
      residential_city: residentialCity,
      residential_state: residentialState,
      nearest_landmark: nearestLandmark,
      country: "Nigeria",
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber,
      verification_status: verificationStatus,
      last_activity_at: now,
      updated_at: now,
    })
    .eq("id", amb.id);

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: user.id,
    actor_role: "user",
    action: "ambassador.profile.updated",
    target_type: "city_ambassador",
    target_id: amb.id,
    metadata: { fields: ["address", "contact"] },
    ip,
  });

  return NextResponse.json({ ok: true });
}
