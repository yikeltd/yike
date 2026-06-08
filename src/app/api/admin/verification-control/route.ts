import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireVerificationControlApi } from "@/lib/admin/api-auth";
import { isSuperAdmin } from "@/lib/admin/roles";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_VERIFICATION_CONFIG,
  getVerificationControlConfig,
  type VerificationControlConfig,
} from "@/lib/verification/config";

export const runtime = "nodejs";

const TOGGLE_KEYS = Object.keys(
  DEFAULT_VERIFICATION_CONFIG
) as (keyof VerificationControlConfig)[];

export async function GET() {
  const auth = await requireVerificationControlApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const config = await getVerificationControlConfig(admin);
  return NextResponse.json({
    config,
    canEditToggles: isSuperAdmin(auth.profile.role),
  });
}

export async function PATCH(req: Request) {
  const auth = await requireVerificationControlApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isSuperAdmin(auth.profile.role)) {
    return NextResponse.json({ error: "Chief admin required to change global toggles" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Partial<VerificationControlConfig>;
  const updates: Partial<VerificationControlConfig> = {};
  for (const key of TOGGLE_KEYS) {
    if (typeof body[key] === "boolean") {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid toggles provided" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("verification_control_config")
    .update({
      ...updates,
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "trust.verification.config.update",
    target_type: "verification_control_config",
    metadata: updates,
    ip,
  });

  return NextResponse.json({ config: data });
}
