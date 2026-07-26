import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { verifyAdminPin, createPinSession } from "@/lib/admin/pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";

async function loadAdminPinHash(userId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("admin_pin_hash")
      .eq("id", userId)
      .maybeSingle();
    return (data?.admin_pin_hash as string | null | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as { pin?: string };
  const pin = body.pin?.trim();

  if (!pin || !/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 6 digits" }, { status: 400 });
  }

  const storedHash = await loadAdminPinHash(auth.user.id);
  const valid = await verifyAdminPin(auth.user.id, pin, storedHash);

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!valid) {
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "pin.failed",
      ip,
    });
    return NextResponse.json({ error: "Invalid PIN" }, { status: 403 });
  }

  await createPinSession(auth.user.id);
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "pin.verify",
    ip,
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ valid: false }, { status: auth.status });
  }

  const { hasValidPinSession } = await import("@/lib/admin/pin");
  const [valid, storedHash] = await Promise.all([
    hasValidPinSession(auth.user.id),
    loadAdminPinHash(auth.user.id),
  ]);
  return NextResponse.json({
    valid,
    hasAdminPin: Boolean(storedHash),
  });
}
