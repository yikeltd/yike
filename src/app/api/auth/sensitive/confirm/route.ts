import { NextResponse } from "next/server";
import { getSessionPolicy, sensitiveActionRequiresOtp } from "@/lib/auth/session-policy";
import { createSensitiveConfirmationToken } from "@/lib/auth/sensitive-token";
import { logAuthSecurityEvent } from "@/lib/auth/security-events";
import { getAuthenticatedUserId, getRequestMeta } from "@/lib/auth/session-state";
import { verifyPin } from "@/lib/pin";
import { createClient } from "@/lib/supabase/server";
import type { AccountType, UserRole } from "@/types/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "generic");
  const pin = body.pin != null ? String(body.pin) : null;
  const password = body.password != null ? String(body.password) : null;
  const { ip, userAgent } = await getRequestMeta(request);

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("pin_hash, email, account_type, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const policy = getSessionPolicy(
    (profile.account_type ?? "individual") as AccountType,
    profile.role as UserRole
  );

  let confirmed = false;

  if (pin && profile.pin_hash && verifyPin(pin, profile.pin_hash)) {
    confirmed = true;
  } else if (password && password.length >= 8 && profile.email) {
    const { error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });
    confirmed = !error;
  }

  if (!confirmed) {
    await logAuthSecurityEvent({
      userId,
      eventType: "sensitive.failed",
      metadata: { action },
      ip,
      userAgent,
    });
    return NextResponse.json(
      { error: "Confirm it's you to continue.", requiresOtp: sensitiveActionRequiresOtp(policy, action) },
      { status: 401 }
    );
  }

  await logAuthSecurityEvent({
    userId,
    eventType: "sensitive.confirmed",
    metadata: { action },
    ip,
    userAgent,
  });

  const confirmationToken = createSensitiveConfirmationToken(userId, action);
  if (!confirmationToken) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    requiresOtp: sensitiveActionRequiresOtp(policy, action),
    confirmationToken,
  });
}
