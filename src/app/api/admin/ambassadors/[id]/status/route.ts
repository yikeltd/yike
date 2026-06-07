import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { incrementCityActiveSlots } from "@/lib/ambassador/slots";
import type { AmbassadorStatus } from "@/lib/ambassador/constants";

type RouteCtx = { params: Promise<{ id: string }> };

const PIN_STATUSES: AmbassadorStatus[] = ["disabled"];

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    status: AmbassadorStatus;
    commissionRate?: number;
    notes?: string;
  };

  const allowed: AmbassadorStatus[] = [
    "approved",
    "paused",
    "disabled",
    "inactive",
    "under_review",
  ];
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (PIN_STATUSES.includes(body.status)) {
    const pinValid = await hasValidPinSession(auth.user.id);
    if (!pinValid) {
      return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
    }
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: ambassador } = await admin
    .from("city_ambassadors")
    .select("*")
    .eq("id", id)
    .single();

  if (!ambassador) {
    return NextResponse.json({ error: "Ambassador not found" }, { status: 404 });
  }

  const patch: Record<string, unknown> = {
    status: body.status,
    updated_at: new Date().toISOString(),
  };
  if (body.commissionRate != null) {
    patch.commission_percentage = body.commissionRate;
  }

  await admin.from("city_ambassadors").update(patch).eq("id", id);

  if (body.status === "disabled" && ambassador.status === "approved") {
    await incrementCityActiveSlots(
      admin,
      ambassador.assigned_city,
      ambassador.assigned_state,
      -1
    );
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  const action =
    body.status === "paused"
      ? "ambassador.pause"
      : body.status === "disabled"
        ? "ambassador.disable"
        : "ambassador.approve";

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action,
    target_type: "city_ambassador",
    target_id: id,
    metadata: { status: body.status, notes: body.notes ?? null },
    ip,
  });

  return NextResponse.json({ ok: true });
}
