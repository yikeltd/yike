import { NextResponse } from "next/server";
import { getSessionPolicy, sensitiveActionRequiresOtp } from "@/lib/auth/session-policy";
import { resetPinFailuresForUser } from "@/lib/auth/pin-lockout";
import { logAuthSecurityEvent } from "@/lib/auth/security-events";
import { getAuthenticatedUserId, getRequestMeta } from "@/lib/auth/session-state";
import { hashPin } from "@/lib/pin";
import { pinPolicyError } from "@/lib/pin-policy";
import { createClient } from "@/lib/supabase/server";
import type { AccountType, UserRole } from "@/types/database";

export const runtime = "nodejs";

/** Reset PIN after password login — clears device lockouts. */
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin ?? "");
  const password = String(body.password ?? "");
  const { ip, userAgent } = await getRequestMeta(request);

  const pinError = pinPolicyError(pin);
  if (pinError) {
    return NextResponse.json({ error: pinError }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Enter your password to reset your PIN." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, account_type, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.email) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (authError) {
    await logAuthSecurityEvent({
      userId,
      eventType: "sensitive.failed",
      metadata: { action: "pin_reset" },
      ip,
      userAgent,
    });
    return NextResponse.json({ error: "Password incorrect." }, { status: 401 });
  }

  const policy = getSessionPolicy(
    (profile.account_type ?? "individual") as AccountType,
    profile.role as UserRole
  );

  const pinHash = hashPin(pin);
  const { error } = await supabase
    .from("profiles")
    .update({ pin_hash: pinHash, has_pin_set: true })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: "Could not save PIN. Try again." }, { status: 500 });
  }

  await resetPinFailuresForUser(userId);

  await logAuthSecurityEvent({
    userId,
    eventType: "pin.reset",
    metadata: { via: "password" },
    ip,
    userAgent,
  });

  return NextResponse.json({
    ok: true,
    requiresOtp: sensitiveActionRequiresOtp(policy, "change_password"),
  });
}
