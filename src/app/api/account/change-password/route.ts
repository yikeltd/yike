import { NextResponse } from "next/server";
import { logAuthSecurityEvent } from "@/lib/auth/security-events";
import {
  parseSensitiveConfirmationToken,
  requireSensitiveConfirmation,
} from "@/lib/auth/require-sensitive-confirmation";
import { getRequestMeta } from "@/lib/auth/session-state";
import { createClient } from "@/lib/supabase/server";
import { createVerifiedAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to change your password." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const gate = requireSensitiveConfirmation(
    parseSensitiveConfirmationToken(body),
    user.id,
    "change_password"
  );
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  const newPassword = String(body.newPassword ?? "");
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Choose a password with at least 8 characters." },
      { status: 400 }
    );
  }

  const admin = await createVerifiedAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { ip, userAgent } = await getRequestMeta(request);
  await logAuthSecurityEvent({
    userId: user.id,
    eventType: "password_change.confirmed",
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true, message: "Password updated." });
}
