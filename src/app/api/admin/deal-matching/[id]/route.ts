import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireDealMatchingApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import {
  COMMISSION_STATUSES,
  DEAL_STATUSES,
  PAYMENT_STATUSES,
} from "@/lib/deal-matching/constants";
import { updateDealStatus } from "@/lib/deal-matching/status";
import type { DealMatchStatus } from "@/lib/deal-matching/constants";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireDealMatchingApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: request, error } = await admin
    .from("deal_match_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [{ data: outreach }, { data: events }] = await Promise.all([
    admin
      .from("deal_match_outreach")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("deal_match_status_events")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const recipientIds = [...new Set((outreach ?? []).map((o) => o.recipient_user_id as string))];
  let profileMap: Record<string, Record<string, unknown>> = {};
  if (recipientIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, company_name, email, role")
      .in("id", recipientIds);
    profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id as string, p]));
  }

  const enrichedOutreach = (outreach ?? []).map((o) => ({
    ...o,
    profiles: profileMap[o.recipient_user_id as string] ?? null,
  }));

  return NextResponse.json({
    request,
    outreach: enrichedOutreach,
    statusEvents: events ?? [],
  });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await requireDealMatchingApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (body.status != null) {
    const status = String(body.status);
    if (!(DEAL_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await updateDealStatus(
      admin,
      id,
      status as DealMatchStatus,
      auth.user.id,
      String(body.status_notes ?? "")
    );
    patch.status = status;
  }

  const commissionFields = [
    "expected_transaction_value",
    "estimated_commission",
    "agreed_percentage",
    "negotiation_notes",
    "internal_notes",
    "assigned_support_id",
  ] as const;

  for (const field of commissionFields) {
    if (body[field] !== undefined) patch[field] = body[field];
  }

  if (body.commission_status != null) {
    const v = String(body.commission_status);
    if (!(COMMISSION_STATUSES as readonly string[]).includes(v)) {
      return NextResponse.json({ error: "Invalid commission status" }, { status: 400 });
    }
    patch.commission_status = v;
  }

  if (body.payment_status != null) {
    const v = String(body.payment_status);
    if (!(PAYMENT_STATUSES as readonly string[]).includes(v)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }
    patch.payment_status = v;
  }

  const { data, error } = await admin
    .from("deal_match_requests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const action = body.status != null ? "deal_matching.status.update" : "deal_matching.commission.update";
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action,
    target_type: "deal_match_request",
    target_id: id,
    metadata: { patch: Object.keys(patch) },
    ip,
  });

  return NextResponse.json({ request: data });
}
