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

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  // admin_pin_hash is not selectable by authenticated — load via service_role.
  const { data: pinRow, error: pinLoadError } = await admin
    .from("profiles")
    .select("admin_pin_hash")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (pinLoadError) {
    console.error("[admin/pin/setup] load failed:", pinLoadError.message);
    return NextResponse.json({ error: "Could not verify PIN state." }, { status: 500 });
  }

  const storedHash = pinRow?.admin_pin_hash as string | null | undefined;
  const hasExistingPin = Boolean(storedHash);

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
      const valid = await verifyAdminPin(auth.user.id, currentPin, storedHash);
      if (!valid) {
        return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 403 });
      }
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ admin_pin_hash: hashPin(pin) })
    .eq("id", auth.user.id);

  if (error) {
    console.error("[admin/pin/setup] update failed:", error.message);
    return NextResponse.json(
      { error: "Could not save PIN. Sign in again and retry." },
      { status: 500 }
    );
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: hasExistingPin ? "pin.admin_change" : "pin.admin_setup",
    target_type: "profile",
    target_id: auth.user.id,
    ip,
  });

  return NextResponse.json({ ok: true });
}
