import { NextResponse } from "next/server";
import { isEmailVerified } from "@/lib/auth";
import { syncProfileVerificationMeta } from "@/lib/verification/enforcement";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeNigerianPhone, canRequestPhoneOtp } from "@/lib/phone";
import { NIGERIAN_STATES } from "@/lib/constants";
import { isBusinessAccount, isDeveloperAccount } from "@/lib/profile/basic-listing-profile";
import { resetWhatsappVerificationOnNumberChange } from "@/lib/whatsapp-verification/service";
import { getWhatsappNumber } from "@/lib/whatsapp-verification/profile";

export const runtime = "nodejs";

type Body = {
  fullName?: string;
  dateOfBirth?: string;
  phone?: string;
  residentialAddress?: string;
  residentialArea?: string;
  residentialCity?: string;
  residentialState?: string;
  companyName?: string;
  cacNumber?: string;
  cacDocumentPath?: string;
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

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("role, email_verified, is_banned, account_type, whatsapp, phone")
    .eq("id", user.id)
    .single();

  if (!existingProfile || existingProfile.is_banned) {
    return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  }

  if (!isEmailVerified(user, { email_verified: existingProfile.email_verified })) {
    return NextResponse.json({ error: "Please verify your email to continue." }, { status: 400 });
  }

  const isBusiness = isBusinessAccount(existingProfile.account_type);
  const isDeveloper = isDeveloperAccount(existingProfile.account_type);
  const residentialAddress = String(body.residentialAddress ?? "").trim();
  const residentialArea = String(body.residentialArea ?? "").trim();
  const residentialCity = String(body.residentialCity ?? "").trim();
  const residentialState = String(body.residentialState ?? "").trim();

  if (!residentialAddress || !residentialCity || !residentialState) {
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

  let fullUpdate: Record<string, unknown>;

  if (isBusiness) {
    const companyName = String(body.companyName ?? "").trim();
    const contactName = String(body.fullName ?? "").trim();
    const cacDocumentPath = String(body.cacDocumentPath ?? "").trim();

    if (!companyName) {
      return NextResponse.json(
        {
          error: isDeveloper
            ? "Add your developer or company name."
            : "Add your company name.",
        },
        { status: 400 }
      );
    }
    if (!contactName) {
      return NextResponse.json({ error: "Add your name." }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    fullUpdate = {
      company_name: companyName,
      full_name: contactName,
      ...(cacDocumentPath ? { cac_document_path: cacDocumentPath } : {}),
      residential_address: residentialAddress,
      residential_area: residentialArea || null,
      residential_city: residentialCity,
      residential_state: residentialState,
      country: "Nigeria",
      office_address: residentialAddress,
      phone,
      whatsapp: phone,
    };
  } else {
    const fullName = String(body.fullName ?? "").trim();
    const dateOfBirth = String(body.dateOfBirth ?? "").trim();

    if (!fullName || !dateOfBirth) {
      return NextResponse.json(
        { error: "Complete all required profile fields." },
        { status: 400 }
      );
    }

    fullUpdate = {
      full_name: fullName,
      date_of_birth: dateOfBirth,
      residential_address: residentialAddress,
      residential_area: residentialArea || null,
      residential_city: residentialCity,
      residential_state: residentialState,
      country: "Nigeria",
      office_address: residentialAddress,
      ...(phone ? { phone, whatsapp: phone } : {}),
    };
  }

  if (phone && existingProfile) {
    const previous = getWhatsappNumber(existingProfile);
    if (phone !== previous) {
      await resetWhatsappVerificationOnNumberChange(admin, user.id, phone, previous);
    }
  }

  let { error } = await admin.from("profiles").update(fullUpdate).eq("id", user.id);

  if (error) {
    console.error("[agent/profile-setup] update failed:", error.message);
    const fallbackUpdate = isBusiness
      ? {
          company_name: fullUpdate.company_name,
          full_name: fullUpdate.full_name,
          office_address: residentialAddress,
          phone: fullUpdate.phone,
          whatsapp: fullUpdate.whatsapp,
        }
      : {
          full_name: fullUpdate.full_name,
          office_address: residentialAddress,
          ...(phone ? { phone, whatsapp: phone } : {}),
        };
    const retry = await admin.from("profiles").update(fallbackUpdate).eq("id", user.id);
    error = retry.error;
    if (error) {
      console.error("[agent/profile-setup] fallback update failed:", error.message);
      return NextResponse.json({ error: "Could not save profile." }, { status: 500 });
    }
  }

  await syncProfileVerificationMeta(admin, user.id);

  return NextResponse.json({ ok: true });
}
