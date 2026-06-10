import { NextResponse } from "next/server";
import { isEmailVerified } from "@/lib/auth";
import { syncProfileVerificationMeta } from "@/lib/verification/enforcement";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeNigerianPhone, canRequestPhoneOtp } from "@/lib/phone";
import { NIGERIAN_STATES } from "@/lib/constants";

export const runtime = "nodejs";

type Body = {
  fullName?: string;
  dateOfBirth?: string;
  phone?: string;
  residentialAddress?: string;
  residentialArea?: string;
  residentialCity?: string;
  residentialState?: string;
  residentialPostalCode?: string;
  country?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;

  const fullName = String(body.fullName ?? "").trim();
  const dateOfBirth = String(body.dateOfBirth ?? "").trim();
  const residentialAddress = String(body.residentialAddress ?? "").trim();
  const residentialArea = String(body.residentialArea ?? "").trim();
  const residentialCity = String(body.residentialCity ?? "").trim();
  const residentialState = String(body.residentialState ?? "").trim();
  const residentialPostalCode = String(body.residentialPostalCode ?? "").trim();
  const country = String(body.country ?? "Nigeria").trim() || "Nigeria";

  if (!fullName || !dateOfBirth || !residentialAddress || !residentialCity || !residentialState) {
    return NextResponse.json(
      { error: "Complete all required profile fields." },
      { status: 400 }
    );
  }

  if (!(NIGERIAN_STATES as readonly string[]).includes(residentialState)) {
    return NextResponse.json({ error: "Select a valid Nigerian state." }, { status: 400 });
  }

  const phoneRaw = String(body.phone ?? "").trim();
  const phone = phoneRaw ? normalizeNigerianPhone(phoneRaw) : "";
  if (phoneRaw && !canRequestPhoneOtp(phone)) {
    return NextResponse.json({ error: "Use a valid Nigerian phone number." }, { status: 400 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role, email_verified, is_banned")
    .eq("id", user.id)
    .single();

  if (!profile || profile.is_banned) {
    return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  }

  if (!isEmailVerified(user, { email_verified: profile.email_verified })) {
    return NextResponse.json({ error: "Please verify your email to continue." }, { status: 400 });
  }

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      date_of_birth: dateOfBirth,
      residential_address: residentialAddress,
      residential_area: residentialArea || null,
      residential_city: residentialCity,
      residential_state: residentialState,
      residential_postal_code: residentialPostalCode || null,
      country,
      office_address: residentialAddress,
      ...(phone ? { phone, whatsapp: phone } : {}),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not save profile." }, { status: 500 });
  }

  await syncProfileVerificationMeta(admin, user.id);

  return NextResponse.json({ ok: true });
}
