import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createClient } from "@/lib/supabase/server";
import { hashPin } from "@/lib/pin";
import { writeAuditLog } from "@/lib/admin/audit";

type PinType = "login" | "admin";

function rpcErrorMessage(message: string): string {
  if (message.includes("profile_not_found")) return "Profile not found";
  if (message.includes("profile_banned")) return "Cannot update PIN for banned account";
  if (message.includes("admin_pin_staff_only")) {
    return "Admin PIN applies to staff accounts only";
  }
  if (message.includes("not_authorized")) return "Super admin access required";
  return "Could not reset PIN";
}

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

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("id, role, is_banned, full_name, email")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.rpc("yike_admin_reset_profile_pin", {
    p_target_id: id,
    p_pin_type: pinType,
    p_pin_hash: hashPin(pin),
  });

  if (error) {
    return NextResponse.json(
      { error: rpcErrorMessage(error.message) },
      { status: error.message.includes("not_found") ? 404 : 500 }
    );
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
      role: target?.role,
      email: target?.email,
      name: target?.full_name,
    },
    ip,
  });

  return NextResponse.json({ ok: true });
}
