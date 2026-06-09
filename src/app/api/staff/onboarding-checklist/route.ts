import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED_KEYS = [
  "password_changed",
  "pin_set",
  "read_ops_guide",
  "confirm_availability",
] as const;

export async function GET() {
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
      "require_password_reset, password_reset_completed_at, onboarding_checklist, status, full_name"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!staff) {
    return NextResponse.json({ showChecklist: false });
  }

  const checklist = (staff.onboarding_checklist ?? {}) as Record<string, boolean>;
  const requiresPasswordReset =
    staff.require_password_reset !== false && !staff.password_reset_completed_at;

  if (requiresPasswordReset) {
    return NextResponse.json({ showChecklist: false, requiresPasswordReset: true });
  }

  const complete = ALLOWED_KEYS.every((k) => checklist[k] === true);

  return NextResponse.json({
    showChecklist: !complete && staff.status !== "archived" && staff.status !== "suspended",
    checklist,
    requiresPasswordReset: false,
  });
}

export async function PATCH(req: Request) {
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

  const body = (await req.json()) as { key: string; completed: boolean };

  if (!ALLOWED_KEYS.includes(body.key as (typeof ALLOWED_KEYS)[number])) {
    return NextResponse.json({ error: "Invalid checklist key" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: staff } = await admin
    .from("staff_profiles")
    .select("onboarding_checklist")
    .eq("id", user.id)
    .maybeSingle();

  const checklist = {
    ...(staff?.onboarding_checklist as Record<string, boolean> | null),
    [body.key]: body.completed,
  };

  await admin
    .from("staff_profiles")
    .update({ onboarding_checklist: checklist })
    .eq("id", user.id);

  return NextResponse.json({ ok: true, checklist });
}
