import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAmbassadorCommission } from "@/lib/ambassador/commission";
import type { RevenueSourceType } from "@/lib/ambassador/constants";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const sourceUserId = String(body.sourceUserId ?? "").trim();
  const paymentReference = String(body.paymentReference ?? "").trim();
  const revenueSourceType = String(body.revenueSourceType ?? "").trim() as RevenueSourceType;
  const grossAmount = Number(body.grossAmount);
  const netAmount = Number(body.netAmount);
  const hiddenFromAmbassador = Boolean(body.hiddenFromAmbassador);
  const hiddenReason = String(body.hiddenReason ?? "").trim() || null;

  if (!sourceUserId || !paymentReference || !revenueSourceType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!Number.isFinite(grossAmount) || !Number.isFinite(netAmount) || netAmount <= 0) {
    return NextResponse.json({ error: "Invalid revenue amounts" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const result = await recordAmbassadorCommission(admin, {
    sourceUserId,
    paymentReference,
    revenueSourceType,
    grossAmount,
    netAmount,
    hiddenFromAmbassador,
    hiddenReason,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "ambassador.commission.record",
    target_type: "ambassador_commission",
    target_id: result.commissionId,
    metadata: { sourceUserId, paymentReference, netAmount, hiddenFromAmbassador },
    ip,
  });

  return NextResponse.json({ ok: true, commissionId: result.commissionId });
}
