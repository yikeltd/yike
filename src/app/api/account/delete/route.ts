import { NextResponse } from "next/server";
import { sendAccountDeletedEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });
  }

  let body: { confirm?: string; password?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { error: 'Type DELETE to confirm account removal.' },
      { status: 400 }
    );
  }

  const password = String(body.password ?? "");
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Enter your password to confirm deletion." },
      { status: 400 }
    );
  }

  const loginEmail = user.email;
  if (!loginEmail) {
    return NextResponse.json(
      { error: "This account has no email on file. Contact hello@yike.ng." },
      { status: 400 }
    );
  }

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  });
  if (passwordError) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Account deletion is not configured. Contact hello@yike.ng." },
      { status: 503 }
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const notifyEmail = user.email ?? profile?.email;
  if (notifyEmail) {
    await sendAccountDeletedEmail(admin, {
      email: notifyEmail,
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "",
    });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    const now = new Date().toISOString();
    const { error: softError } = await admin
      .from("profiles")
      .update({
        account_status: "deleted",
        profile_status: "deleted",
        deleted_at: now,
        is_banned: true,
      })
      .eq("id", user.id);

    if (softError) {
      return NextResponse.json(
        { error: "Could not delete account. Try again or email hello@yike.ng." },
        { status: 500 }
      );
    }

    await admin
      .from("properties")
      .update({ status: "hidden" })
      .eq("agent_id", user.id)
      .in("status", ["pending", "approved"]);
  }

  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    /* client will clear locally */
  }

  return NextResponse.json({ ok: true });
}
