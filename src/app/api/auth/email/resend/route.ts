import { NextResponse } from "next/server";
import { resendEmailVerification } from "@/lib/email";
import { EMAIL_USER_MESSAGES } from "@/lib/notifications/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: EMAIL_USER_MESSAGES.sendFailed }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: EMAIL_USER_MESSAGES.notSignedIn }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: EMAIL_USER_MESSAGES.sendFailed }, { status: 503 });
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then((r) => r.data?.full_name)) ??
    "";

  const result = await resendEmailVerification(admin, {
    email: user.email,
    fullName,
    userId: user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, message: EMAIL_USER_MESSAGES.verificationResent });
}
