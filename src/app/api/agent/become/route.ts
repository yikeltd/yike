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
import type { AccountType, UserRole } from "@/types/database";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ALLOWED_ACCOUNT_TYPES = new Set<AccountType>([
  "individual",
  "agent",
  "agency",
  "landlord",
  "developer",
]);

const LISTER_ROLES = new Set<UserRole>([
  "agent",
  "agent_unverified",
  "agent_verified",
  "admin",
  "super_admin",
]);

async function loadOrCreateProfile(admin: SupabaseClient, user: User) {
  const { data: existing } = await admin
    .from("profiles")
    .select("role, phone_verified, email_verified, is_banned, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const fullName =
    String(user.user_metadata?.full_name ?? "").trim() ||
    user.email?.split("@")[0] ||
    "User";

  const { data: created, error } = await admin
    .from("profiles")
    .insert({
      id: user.id,
      full_name: fullName,
      role: "user",
      email_verified: Boolean(user.email_confirmed_at),
      verification_status: "not_started",
      is_banned: false,
    })
    .select("role, phone_verified, email_verified, is_banned, full_name")
    .single();

  if (error) {
    console.error("[agent/become] profile bootstrap failed:", error.message);
    return null;
  }

  return created;
}

async function applyAgentUpgrade(
  admin: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await admin.from("profiles").update(payload).eq("id", userId);

  if (!error) return { ok: true };

  console.error("[agent/become] profile update failed:", error.message, error.code);

  const withoutRules = { ...payload };
  delete withoutRules.listing_rules_accepted_at;
  if (Object.keys(withoutRules).length > 0) {
    const { error: retryError } = await admin
      .from("profiles")
      .update(withoutRules)
      .eq("id", userId);

    if (!retryError) {
      if (payload.listing_rules_accepted_at) {
        await admin
          .from("profiles")
          .update({
            listing_rules_accepted_at: payload.listing_rules_accepted_at,
          })
          .eq("id", userId);
      }
      return { ok: true };
    }

    console.error("[agent/become] retry without rules timestamp failed:", retryError.message);
  }

  return { ok: false, error: error.message };
}

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

  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    accountType?: AccountType;
    whatsapp?: string;
    acceptRules?: boolean;
  };

  if (!body.acceptRules) {
    return NextResponse.json(
      { error: "Accept listing terms to continue" },
      { status: 400 }
    );
  }

  const whatsapp = body.whatsapp ? normalizeNigerianPhone(body.whatsapp) : "";
  const hasWhatsApp = Boolean(whatsapp && canRequestPhoneOtp(whatsapp));
  if (body.whatsapp && !hasWhatsApp) {
    return NextResponse.json(
      { error: "Add a valid Nigerian WhatsApp number or leave it blank." },
      { status: 400 }
    );
  }

  const accountType =
    body.accountType && ALLOWED_ACCOUNT_TYPES.has(body.accountType)
      ? body.accountType
      : "individual";

  const profile = await loadOrCreateProfile(admin, user);

  if (!profile || profile.is_banned) {
    return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  }

  const rulesAcceptedAt = new Date().toISOString();
  const contactPatch = hasWhatsApp ? { whatsapp, phone: whatsapp } : {};

  if (LISTER_ROLES.has(profile.role as UserRole)) {
    const result = await applyAgentUpgrade(admin, user.id, {
      ...contactPatch,
      account_type: accountType,
      listing_rules_accepted_at: rulesAcceptedAt,
    });

    if (!result.ok) {
      return NextResponse.json({ error: "Could not upgrade account" }, { status: 500 });
    }

    await syncProfileVerificationMeta(admin, user.id).catch((err) => {
      console.error("[agent/become] verification meta sync failed:", err);
    });

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

  const result = await applyAgentUpgrade(admin, user.id, {
    role: "agent_unverified",
    listing_limit: UNVERIFIED_AGENT_LISTING_LIMIT,
    verified_badge: false,
    account_type: accountType,
    verification_status: "not_started",
    listing_rules_accepted_at: rulesAcceptedAt,
    ...contactPatch,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Could not upgrade account" }, { status: 500 });
  }

  await syncProfileVerificationMeta(admin, user.id).catch((err) => {
    console.error("[agent/become] verification meta sync failed:", err);
  });

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
