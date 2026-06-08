import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireDealMatchingApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import { MAX_OUTREACH_RECIPIENTS } from "@/lib/deal-matching/constants";
import { sendDealOutreachNotifications } from "@/lib/deal-matching/outreach";
import { updateDealStatus } from "@/lib/deal-matching/status";
import type { DealMatchRequest } from "@/types/deal-matching";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireDealMatchingApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    recipientIds?: string[];
    recipientType?: "agent" | "company" | "user";
    excludedIds?: string[];
  };

  const recipientIds = [...new Set(body.recipientIds ?? [])].filter(Boolean);
  const excluded = new Set(body.excludedIds ?? []);
  const filtered = recipientIds.filter((rid) => !excluded.has(rid));

  if (filtered.length === 0) {
    return NextResponse.json({ error: "Select at least one recipient" }, { status: 400 });
  }
  if (filtered.length > MAX_OUTREACH_RECIPIENTS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_OUTREACH_RECIPIENTS} recipients per outreach` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: request, error: loadError } = await admin
    .from("deal_match_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (loadError || !request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const recipientType = body.recipientType ?? "agent";
  const rows = filtered.map((recipient_user_id) => ({
    request_id: id,
    recipient_user_id,
    recipient_type: recipientType,
    status: "pending",
    created_by: auth.user.id,
  }));

  const { data: outreachRows, error: insertError } = await admin
    .from("deal_match_outreach")
    .insert(rows)
    .select("id, recipient_user_id");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { sentCount } = await sendDealOutreachNotifications(
    admin,
    request as DealMatchRequest,
    outreachRows ?? [],
    auth.user.id
  );

  if (request.status === "created") {
    await updateDealStatus(admin, id, "outreach_sent", auth.user.id, "Agent outreach sent");
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "deal_matching.outreach.send",
    target_type: "deal_match_request",
    target_id: id,
    metadata: { recipient_count: filtered.length, sent_count: sentCount },
    ip,
  });

  return NextResponse.json({
    ok: true,
    sentCount,
    outreach: outreachRows ?? [],
  });
}
