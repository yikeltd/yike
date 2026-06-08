import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UNVERIFIED_AGENT_LISTING_LIMIT } from "@/lib/agent-tiers";
import { isPhoneVerificationRequired } from "@/lib/feature-flags";
import { applyAmbassadorAttribution } from "@/lib/ambassador/attribution";
import { getAmbassadorRefFromCookies } from "@/lib/ambassador/cookie";
import { isEmailVerified } from "@/lib/auth";
import { syncProfileVerificationMeta } from "@/lib/verification/enforcement";
import { canRequestPhoneOtp, normalizeNigerianPhone } from "@/lib/phone";
import type { AccountType } from "@/types/database";

export const runtime = "nodejs";

const ALLOWED_ACCOUNT_TYPES = new Set<AccountType>([
  "individual",
  "agency",
  "landlord",
  "developer",
]);

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

  const body = (await request.json().catch(() => ({}))) as {
    accountType?: AccountType;
    whatsapp?: string;
    acceptRules?: boolean;
  };

  if (!body.acceptRules) {
    return NextResponse.json(
      { error: "Accept listing rules to continue" },
      { status: 400 }
    );
  }

  const whatsapp = body.whatsapp
    ? normalizeNigerianPhone(body.whatsapp)
    : "";
  if (!canRequestPhoneOtp(whatsapp)) {
    return NextResponse.json(
      { error: "Add a valid Nigerian WhatsApp number" },
      { status: 400 }
    );
  }

  const accountType =
    body.accountType && ALLOWED_ACCOUNT_TYPES.has(body.accountType)
      ? body.accountType
      : "individual";

  const { data: profile } = await admin
    .from("profiles")
    .select("role, phone_verified, email_verified, is_banned, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.is_banned) {
    return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  }

  if (
    profile.role === "agent_unverified" ||
    profile.role === "agent_verified" ||
    profile.role === "admin" ||
    profile.role === "super_admin"
  ) {
    await admin
      .from("profiles")
      .update({
        whatsapp,
        phone: whatsapp,
        account_type: accountType,
        listing_rules_accepted_at: new Date().toISOString(),
        adaptive_trust_level: 2,
      })
      .eq("id", user.id);
    await syncProfileVerificationMeta(admin, user.id);
    return NextResponse.json({ ok: true, alreadyAgent: true });
  }

  if (isPhoneVerificationRequired() && !profile.phone_verified) {
    return NextResponse.json(
      { error: "Verify your phone number first" },
      { status: 400 }
    );
  }

  if (!isEmailVerified(user, { email_verified: profile.email_verified })) {
    return NextResponse.json(
      { error: "Verify your email first" },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("profiles")
    .update({
      role: "agent_unverified",
      listing_limit: UNVERIFIED_AGENT_LISTING_LIMIT,
      verified_badge: false,
      account_type: accountType,
      whatsapp,
      phone: whatsapp,
      verification_status: "pending",
      listing_rules_accepted_at: new Date().toISOString(),
      adaptive_trust_level: 2,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not upgrade account" }, { status: 500 });
  }

  await syncProfileVerificationMeta(admin, user.id);

  const referralCode = await getAmbassadorRefFromCookies();
  if (referralCode) {
    await applyAmbassadorAttribution(admin, {
      userId: user.id,
      referralCode,
      userEmail: user.email,
    });
  }

  return NextResponse.json({
    ok: true,
    role: "agent_unverified",
    listingLimit: UNVERIFIED_AGENT_LISTING_LIMIT,
  });
}
