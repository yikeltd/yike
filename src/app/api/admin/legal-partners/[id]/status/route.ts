import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LegalPartnerStatus } from "@/lib/legal-partner/constants";

type RouteCtx = { params: Promise<{ id: string }> };

const PIN_STATUSES: LegalPartnerStatus[] = ["suspended", "fraud_review"];

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as { status: LegalPartnerStatus; notes?: string };

  const allowed: LegalPartnerStatus[] = [
    "approved",
    "paused",
    "suspended",
    "inactive",
    "fraud_review",
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

  const patch: Record<string, unknown> = {
    status: body.status,
    updated_at: new Date().toISOString(),
  };

  if (body.status === "suspended" || body.status === "fraud_review") {
    patch.payout_enabled = false;
    patch.payout_hold_reason = body.notes?.trim() || `Status: ${body.status}`;
  }

  await admin.from("legal_partners").update(patch).eq("id", id);

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "legal_partner.suspend",
    target_type: "legal_partner",
    target_id: id,
    metadata: { status: body.status, notes: body.notes ?? null },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ ok: true });
}
