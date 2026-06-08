import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LeadDealStatus, TransactionStage } from "@/types/database";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

const LEAD_STATUSES: LeadDealStatus[] = [
  "new",
  "contacted",
  "qualified",
  "inspection_requested",
  "negotiation",
  "closed_won",
  "closed_lost",
  "spam",
];

const STAGES: TransactionStage[] = [
  "inquiry",
  "inspection",
  "offer",
  "due_diligence",
  "agreement",
  "payment",
  "closed",
];

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    lead_status?: LeadDealStatus;
    transaction_stage?: TransactionStage | null;
    estimated_budget?: number | null;
    potential_deal_value?: number | null;
    internal_notes?: string | null;
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: existing } = await supabase
    .from("leads")
    .select("id, lead_status, transaction_stage, internal_notes, potential_deal_value")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};

  if (body.lead_status !== undefined) {
    if (!LEAD_STATUSES.includes(body.lead_status)) {
      return NextResponse.json({ error: "Invalid lead status" }, { status: 400 });
    }
    patch.lead_status = body.lead_status;
  }
  if (body.transaction_stage !== undefined) {
    if (
      body.transaction_stage !== null &&
      !STAGES.includes(body.transaction_stage)
    ) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    patch.transaction_stage = body.transaction_stage;
  }
  if (body.estimated_budget !== undefined) {
    patch.estimated_budget = body.estimated_budget;
  }
  if (body.potential_deal_value !== undefined) {
    patch.potential_deal_value = body.potential_deal_value;
  }
  if (body.internal_notes !== undefined) {
    patch.internal_notes = body.internal_notes?.trim() || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "lead.deal_status",
    target_type: "lead",
    target_id: id,
    metadata: {
      old: existing,
      new: patch,
    },
    ip,
  });

  return NextResponse.json({ lead: data });
}
