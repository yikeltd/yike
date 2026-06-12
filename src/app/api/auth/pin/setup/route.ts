import { NextResponse } from "next/server";
import { resetPinFailuresForUser } from "@/lib/auth/pin-lockout";
import { logAuthSecurityEvent } from "@/lib/auth/security-events";
import { getAuthenticatedUserId, getRequestMeta } from "@/lib/auth/session-state";
import { hashPin } from "@/lib/pin";
import { pinPolicyError } from "@/lib/pin-policy";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  if (password.length >= 8) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (authError) {
      return NextResponse.json({ error: "Password incorrect." }, { status: 401 });
    }
  }

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
    metadata: { via: "setup" },
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
