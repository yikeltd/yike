import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffRole } from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";

export const runtime = "nodejs";

/**
 * Server-side staff gate after client password sign-in.
 * Uses service role so pin-hash column grants / client RLS quirks
 * cannot falsely deny a real staff account.
 */
export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .select("role, is_banned, last_login_at, email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[staff/verify-access]", error.message);
    return NextResponse.json({ ok: false, error: "Profile lookup failed" }, { status: 500 });
  }

  if (!profile || profile.is_banned || !isStaffRole(profile.role as UserRole)) {
    await supabase.auth.signOut();
    return NextResponse.json(
      {
        ok: false,
        error: "Access denied. This account is not authorised for internal consoles.",
      },
      { status: 403 }
    );
  }

  // Founder / bootstrap admins may exist only on profiles — ensure staff_profiles.
  const { data: staff } = await admin
    .from("staff_profiles")
    .select("id, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!staff) {
    const email = (profile.email || user.email || "").trim().toLowerCase();
    const { error: staffError } = await admin.from("staff_profiles").insert({
      id: user.id,
      full_name: profile.full_name || "Staff",
      email: email || user.id,
      work_email: email || null,
      role: profile.role,
      status: "active",
      require_password_reset: true,
      password_reset_completed_at: null,
      onboarding_checklist: {},
      access_checklist: {},
      hr_metadata: {},
    });
    if (staffError) {
      console.error("[staff/verify-access] provision staff_profiles:", staffError.message);
    }
  }

  await admin
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({
    ok: true,
    role: profile.role as UserRole,
  });
}
