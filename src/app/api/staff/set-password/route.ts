import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await req.json()) as { current_password: string; new_password: string };

  if (!body.current_password || !body.new_password) {
    return NextResponse.json({ error: "Missing passwords" }, { status: 400 });
  }

  if (body.new_password.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password: body.current_password,
  });

  if (verifyError) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: body.new_password,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const admin = createAdminClient();
  if (admin) {
    const now = new Date().toISOString();
    const { data: staff } = await admin
      .from("staff_profiles")
      .select("onboarding_checklist")
      .eq("id", user.id)
      .maybeSingle();

    const checklist = {
      ...(staff?.onboarding_checklist as Record<string, boolean> | null),
      password_changed: true,
    };

    await admin
      .from("staff_profiles")
      .update({
        password_reset_completed_at: now,
        require_password_reset: false,
        status: "active",
        onboarding_checklist: checklist,
      })
      .eq("id", user.id);
  }

  return NextResponse.json({ ok: true });
}
