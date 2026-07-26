import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailVerified } from "@/lib/auth";
import { NIGERIAN_STATES } from "@/lib/constants";
import { UNVERIFIED_AGENT_LISTING_LIMIT } from "@/lib/agent-tiers";
import { applyAmbassadorAttribution } from "@/lib/ambassador/attribution";
import { getAmbassadorRefFromCookies } from "@/lib/ambassador/cookie";
import { syncProfileVerificationMeta } from "@/lib/verification/enforcement";
import {
  ensurePendingManualSellerVerification,
  isPhoneVerifiedForSeller,
  SELLER_CHOOSE_LISTING_PATH,
} from "@/lib/seller-trust";
import type { AccountType, UserRole } from "@/types/database";

export const runtime = "nodejs";

const LISTER_ROLES = new Set<UserRole>([
  "agent",
  "agent_unverified",
  "agent_verified",
  "admin",
  "super_admin",
]);

type Body = {
  residentialState?: string;
  residentialAddress?: string;
  dateOfBirth?: string;
  occupation?: string;
  referralCode?: string;
  consentAccepted?: boolean;
  accountType?: AccountType;
};

function parseDob(raw: string): string | null {
  const value = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const nowYear = new Date().getUTCFullYear();
  if (year < 1920 || year > nowYear - 16) return null;
  return value;
}

async function ensureSellerRole(
  admin: SupabaseClient,
  user: User,
  profile: {
    role: UserRole;
    account_type?: AccountType | null;
  },
  accountType: AccountType
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (LISTER_ROLES.has(profile.role)) {
    if (accountType && accountType !== profile.account_type) {
      const patch: Record<string, unknown> = {
        account_type: accountType,
        listing_rules_accepted_at: new Date().toISOString(),
      };
      const { error } = await admin.from("profiles").update(patch).eq("id", user.id);
      if (error?.message?.includes("listing_rules_accepted_at")) {
        delete patch.listing_rules_accepted_at;
        const retry = await admin.from("profiles").update(patch).eq("id", user.id);
        if (retry.error) {
          console.error("[seller-verification] account type update failed:", retry.error.message);
          return { ok: false, error: "Could not start seller account.", status: 500 };
        }
      } else if (error) {
        console.error("[seller-verification] account type update failed:", error.message);
        return { ok: false, error: "Could not start seller account.", status: 500 };
      }
    }
    return { ok: true };
  }

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    role: "agent_unverified",
    listing_limit: UNVERIFIED_AGENT_LISTING_LIMIT,
    subscription_plan_code: "free",
    starter_plan_started_at: now,
    listing_limit_reason: "subscription:free",
    verified_badge: false,
    account_type: accountType,
    listing_rules_accepted_at: now,
  };

  let { error } = await admin.from("profiles").update(payload).eq("id", user.id);

  // Production may lag migrations that add listing_rules_accepted_at.
  if (error?.message?.includes("listing_rules_accepted_at")) {
    delete payload.listing_rules_accepted_at;
    const retry = await admin.from("profiles").update(payload).eq("id", user.id);
    error = retry.error;
  }

  if (error) {
    console.error("[seller-verification] become seller failed:", error.message);
    return { ok: false, error: "Could not start seller account.", status: 500 };
  }
  return { ok: true };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Seller verification is temporarily unavailable. Check your connection and try again.",
      },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Seller verification is temporarily unavailable. Try again in a few minutes.",
      },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as Body;

  if (!body.consentAccepted) {
    return NextResponse.json(
      { error: "Confirm the accuracy consent to continue." },
      { status: 400 }
    );
  }

  const residentialState = String(body.residentialState ?? "").trim();
  const residentialAddress = String(body.residentialAddress ?? "").trim();
  const dateOfBirth = parseDob(String(body.dateOfBirth ?? ""));
  const occupation = String(body.occupation ?? "").trim();
  const referralCode = String(body.referralCode ?? "").trim();
  const accountType: AccountType =
    body.accountType === "agent" ||
    body.accountType === "agency" ||
    body.accountType === "landlord" ||
    body.accountType === "developer" ||
    body.accountType === "dealer"
      ? body.accountType
      : "individual";

  if (!residentialState || !(NIGERIAN_STATES as readonly string[]).includes(residentialState)) {
    return NextResponse.json({ error: "Select a valid Nigerian state." }, { status: 400 });
  }
  if (residentialAddress.length < 8) {
    return NextResponse.json(
      { error: "Enter your full address (house number, street, area)." },
      { status: 400 }
    );
  }
  if (!dateOfBirth) {
    return NextResponse.json(
      { error: "Enter a valid date of birth (you must be at least 16)." },
      { status: 400 }
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "role, email_verified, phone_verified, phone_verified_at, whatsapp_verification_status, whatsapp_verified_at, is_banned, full_name, phone, whatsapp, email, account_type, verification_status, verified_badge, avatar_url"
    )
    .eq("id", user.id)
    .single();

  if (!profile || profile.is_banned) {
    return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  }

  if (!isEmailVerified(user, { email_verified: profile.email_verified })) {
    return NextResponse.json({ error: "Verify your email first." }, { status: 400 });
  }

  if (!isPhoneVerifiedForSeller(profile)) {
    return NextResponse.json(
      {
        error: "Verify your phone number first.",
        code: "phone_verification_required",
      },
      { status: 400 }
    );
  }

  const roleResult = await ensureSellerRole(admin, user, profile, accountType);
  if (!roleResult.ok) {
    return NextResponse.json({ error: roleResult.error }, { status: roleResult.status });
  }

  const now = new Date().toISOString();
  const phone = (profile.whatsapp ?? profile.phone ?? "").trim() || null;
  const email = (profile.email ?? user.email ?? "").trim().toLowerCase() || null;
  const fullName = (profile.full_name ?? "").trim() || null;

  const profilePatch: Record<string, unknown> = {
    date_of_birth: dateOfBirth,
    residential_address: residentialAddress,
    residential_state: residentialState,
    residential_city: residentialState,
    office_address: residentialAddress,
    country: "Nigeria",
    seller_profile_completed_at: now,
    verification_submitted_at: now,
    verification_status: "pending",
    verified_badge: false,
    ...(referralCode ? { referral_code_used: referralCode } : {}),
  };

  let { error: profileError } = await admin
    .from("profiles")
    .update(profilePatch)
    .eq("id", user.id);

  // Pre-migration fallback if timestamp columns are not yet applied.
  if (
    profileError?.message?.includes("seller_profile_completed_at") ||
    profileError?.message?.includes("verification_submitted_at")
  ) {
    delete profilePatch.seller_profile_completed_at;
    delete profilePatch.verification_submitted_at;
    const retry = await admin.from("profiles").update(profilePatch).eq("id", user.id);
    profileError = retry.error;
  }

  if (profileError) {
    console.error("[seller-verification] profile save failed:", profileError.message);
    return NextResponse.json({ error: "Could not save seller profile." }, { status: 500 });
  }

  await ensurePendingManualSellerVerification(admin, user.id, {
    full_name: fullName,
    phone,
    whatsapp: phone,
    email,
    email_verified: true,
    phone_verified: true,
    verification_status: "pending",
    verified_badge: false,
    role: "agent_unverified",
    is_banned: false,
  });

  // Enrich the latest pending verification row with onboarding details.
  const { data: latest } = await admin
    .from("agent_verifications")
    .select("id, status")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.id && latest.status === "pending") {
    await admin
      .from("agent_verifications")
      .update({
        full_name: fullName,
        residential_address: residentialAddress,
        state: residentialState,
        city: residentialState,
        date_of_birth: dateOfBirth,
        phone,
        email,
        occupation: occupation || null,
        submitted_at: now,
        verification_notes:
          "Seller Verification & Onboarding v1 — profile submitted for manual review.",
      })
      .eq("id", latest.id);
  } else if (!latest || latest.status === "rejected") {
    await admin.from("agent_verifications").insert({
      agent_id: user.id,
      user_id: user.id,
      full_name: fullName,
      residential_address: residentialAddress,
      state: residentialState,
      city: residentialState,
      date_of_birth: dateOfBirth,
      phone,
      email,
      occupation: occupation || null,
      status: "pending",
      nin_provider: "manual_review",
      nin_verified: false,
      selfie_url: null,
      submitted_at: now,
      verification_notes:
        "Seller Verification & Onboarding v1 — profile submitted for manual review.",
    });
  }

  const code = referralCode || (await getAmbassadorRefFromCookies());
  if (code) {
    await applyAmbassadorAttribution(admin, {
      userId: user.id,
      referralCode: code,
      userEmail: user.email,
    });
  }

  await syncProfileVerificationMeta(admin, user.id).catch((err) => {
    console.error("[seller-verification] meta sync failed:", err);
  });

  return NextResponse.json({
    ok: true,
    next: SELLER_CHOOSE_LISTING_PATH,
  });
}
