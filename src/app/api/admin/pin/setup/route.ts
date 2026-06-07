import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import {
  hasValidPinSession,
  verifyAdminPin,
} from "@/lib/admin/pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin } from "@/lib/pin";
import { writeAuditLog } from "@/lib/admin/audit";

export async function POST(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    pin?: string;
    confirmPin?: string;
    currentPin?: string;
  };

  const pin = body.pin?.trim();
  const confirmPin = body.confirmPin?.trim() ?? pin;

  if (!pin || !/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 6 digits" }, { status: 400 });
  }

  if (pin !== confirmPin) {
    return NextResponse.json({ error: "PINs do not match" }, { status: 400 });
  }

  const { profile } = auth;
  const hasExistingPin = Boolean(profile.admin_pin_hash);

  if (hasExistingPin) {
    const sessionValid = await hasValidPinSession(auth.user.id);
    if (!sessionValid) {
      const currentPin = body.currentPin?.trim();
      if (!currentPin) {
        return NextResponse.json(
          { error: "Current PIN or active PIN session required" },
          { status: 403 }
        );
      }
      const valid = await verifyAdminPin(
        auth.user.id,
        currentPin,
        profile.admin_pin_hash
      );
      if (!valid) {
        return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 403 });
      }
    }
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ admin_pin_hash: hashPin(pin) })
    .eq("id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: profile.role,
    action: hasExistingPin ? "pin.admin_change" : "pin.admin_setup",
    target_type: "profile",
    target_id: auth.user.id,
    ip,
  });

  return NextResponse.json({ ok: true });
}
