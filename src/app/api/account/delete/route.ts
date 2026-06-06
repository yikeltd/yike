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

  let body: { confirm?: string } = {};
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
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
