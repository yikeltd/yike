import { NextResponse } from "next/server";
import { isEmailVerified } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeNigerianPhone, canRequestPhoneOtp } from "@/lib/phone";
import { NIGERIAN_STATES } from "@/lib/constants";
import { resolveDealerBusinessType } from "@/lib/dealer/business-types";
import { syncProfileVerificationMeta } from "@/lib/verification/enforcement";

export const runtime = "nodejs";

type Body = {
  businessTypeId?: string;
  companyName?: string;
  cacNumber?: string;
  companyBio?: string;
  officeAddress?: string;
  residentialState?: string;
  residentialCity?: string;
  phone?: string;
  whatsapp?: string;
  fullName?: string;
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

  const { data: existing } = await admin
    .from("profiles")
    .select("is_banned, email_verified, full_name")
    .eq("id", user.id)
    .single();

  if (!existing || existing.is_banned) {
    return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  }

  if (!isEmailVerified(user, { email_verified: existing.email_verified })) {
    return NextResponse.json({ error: "Please verify your email to continue." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const resolved = resolveDealerBusinessType(body.businessTypeId);
  const companyName = String(body.companyName ?? "").trim();
  const officeAddress = String(body.officeAddress ?? "").trim();
  const residentialState = String(body.residentialState ?? "").trim();
  const residentialCity = String(body.residentialCity ?? "").trim();
  const phoneRaw = String(body.phone ?? "").trim();
  const whatsappRaw = String(body.whatsapp ?? "").trim() || phoneRaw;
  const fullName =
    String(body.fullName ?? "").trim() ||
    String(existing.full_name ?? "").trim() ||
    companyName;

  if (!resolved) {
    return NextResponse.json({ error: "Select a business type." }, { status: 400 });
  }
  if (companyName.length < 2) {
    return NextResponse.json({ error: "Add your business name." }, { status: 400 });
  }
  if (!officeAddress || !residentialCity || !residentialState) {
    return NextResponse.json({ error: "Complete address fields." }, { status: 400 });
  }
  if (!(NIGERIAN_STATES as readonly string[]).includes(residentialState)) {
    return NextResponse.json({ error: "Select a valid Nigerian state." }, { status: 400 });
  }

  const phone = phoneRaw ? normalizeNigerianPhone(phoneRaw) : "";
  if (!phone || !canRequestPhoneOtp(phone)) {
    return NextResponse.json({ error: "Use a valid Nigerian phone number." }, { status: 400 });
  }
  const whatsapp = whatsappRaw ? normalizeNigerianPhone(whatsappRaw) : phone;

  const update = {
    account_type: resolved.accountType,
    company_name: companyName,
    full_name: fullName,
    cac_number: String(body.cacNumber ?? "").trim() || null,
    company_bio: String(body.companyBio ?? "").trim() || null,
    office_address: officeAddress,
    residential_address: officeAddress,
    residential_city: residentialCity,
    residential_state: residentialState,
    country: "Nigeria",
    phone,
    whatsapp,
  };

  const { error } = await admin.from("profiles").update(update).eq("id", user.id);
  if (error) {
    console.error("[agent/dealer-onboard]", error.message);
    return NextResponse.json({ error: "Could not save profile." }, { status: 500 });
  }

  await syncProfileVerificationMeta(admin, user.id);
  return NextResponse.json({ ok: true, accountType: resolved.accountType });
}
