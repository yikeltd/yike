import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin } from "@/lib/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { isStaffRole } from "@/lib/admin/roles";

type PinType = "login" | "admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN session required" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json()) as { pinType?: PinType; pin?: string };

  const pinType = body.pinType;
  const pin = body.pin?.trim();

  if (pinType !== "login" && pinType !== "admin") {
    return NextResponse.json({ error: "Invalid pin type" }, { status: 400 });
  }

  if (!pin || !/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 6 digits" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: target, error: fetchError } = await supabase
    .from("profiles")
    .select("id, role, is_banned, full_name, email")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !target) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (target.is_banned) {
    return NextResponse.json({ error: "Cannot update PIN for banned account" }, { status: 400 });
  }

  if (pinType === "admin" && !isStaffRole(target.role)) {
    return NextResponse.json(
      { error: "Admin PIN applies to staff accounts only" },
      { status: 400 }
    );
  }

  const updateField = pinType === "admin" ? "admin_pin_hash" : "pin_hash";

  const { error } = await supabase
    .from("profiles")
    .update({ [updateField]: hashPin(pin) })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: pinType === "admin" ? "pin.admin_reset" : "pin.login_reset",
    target_type: "profile",
    target_id: id,
    metadata: {
      role: target.role,
      email: target.email,
      name: target.full_name,
    },
    ip,
  });

  return NextResponse.json({ ok: true });
}
