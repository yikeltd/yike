import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffAccessBlocked } from "@/lib/admin/staff-onboarding/status";

export const runtime = "nodejs";

export async function POST() {
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

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: staff } = await admin
    .from("staff_profiles")
    .select(
      "status, require_password_reset, password_reset_completed_at, first_login_at, onboarding_checklist"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!staff) {
    return NextResponse.json({ ok: true, staff: false });
  }

  if (isStaffAccessBlocked(staff.status)) {
    await supabase.auth.signOut();
    return NextResponse.json(
      {
        blocked: true,
        reason: staff.status === "archived" ? "archived" : "suspended",
        message: "Your staff access has been suspended. Contact your supervisor.",
      },
      { status: 403 }
    );
  }

  const now = new Date().toISOString();
  const isFirstLogin = !staff.first_login_at;

  if (isFirstLogin) {
    await admin
      .from("staff_profiles")
      .update({ first_login_at: now, last_login_at: now })
      .eq("id", user.id);
  } else {
    await admin.from("staff_profiles").update({ last_login_at: now }).eq("id", user.id);
  }

  const requiresPasswordReset =
    staff.require_password_reset !== false && !staff.password_reset_completed_at;

  return NextResponse.json({
    ok: true,
    staff: true,
    isFirstLogin,
    requiresPasswordReset,
    status: staff.status,
    onboardingChecklist: staff.onboarding_checklist ?? {},
  });
}
