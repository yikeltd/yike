import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "").trim();
  const maxSlots = Number(body.maxSlots);
  const recruitmentPaused = Boolean(body.recruitmentPaused);
  const active = body.active !== false;

  if (!id || !Number.isFinite(maxSlots) || maxSlots < 0) {
    return NextResponse.json({ error: "Invalid slot update" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { error } = await admin
    .from("city_ambassador_slots")
    .update({
      max_slots: Math.floor(maxSlots),
      recruitment_paused: recruitmentPaused,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "ambassador.slot.update",
    target_type: "city_ambassador_slot",
    target_id: id,
    metadata: { maxSlots, recruitmentPaused, active },
    ip,
  });

  return NextResponse.json({ ok: true });
}
