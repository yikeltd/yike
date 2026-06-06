import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReviewStatus, ReplyStatus } from "@/types/database";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const rating = searchParams.get("rating");
  const agentId = searchParams.get("agent_id");

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let query = supabase
    .from("agent_reviews")
    .select(`
      *,
      reviewer:profiles!agent_reviews_reviewer_id_fkey(id, full_name, email),
      agent:profiles!agent_reviews_agent_id_fkey(id, full_name, agent_type),
      replies:review_replies(id, body, status, created_at, user_id)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);
  if (rating) query = query.eq("rating", parseInt(rating, 10));
  if (agentId) query = query.or(`agent_id.eq.${agentId},company_id.eq.${agentId}`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data ?? [] });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    id: string;
    action: "approve" | "reject" | "hide" | "flag" | "delete";
    reason?: string;
    reply_id?: string;
    reply_action?: "approve" | "reject" | "hide";
    require_pin?: boolean;
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (body.reply_id && body.reply_action) {
    const replyStatus: ReplyStatus =
      body.reply_action === "approve"
        ? "approved"
        : body.reply_action === "reject"
          ? "rejected"
          : "hidden";

    await supabase
      .from("review_replies")
      .update({
        status: replyStatus,
        approved_at: replyStatus === "approved" ? new Date().toISOString() : null,
        approved_by: auth.user.id,
      })
      .eq("id", body.reply_id);

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: `review.reply.${body.reply_action}`,
      target_type: "review_reply",
      target_id: body.reply_id,
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  const highRisk = body.action === "delete";
  if (highRisk) {
    const pinValid = await hasValidPinSession(auth.user.id);
    if (!pinValid) {
      return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
    }
  }

  const statusMap: Record<string, ReviewStatus> = {
    approve: "approved",
    reject: "rejected",
    hide: "hidden",
    flag: "flagged",
  };

  if (body.action === "delete") {
    await supabase.from("agent_reviews").delete().eq("id", body.id);
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "review.delete",
      target_type: "review",
      target_id: body.id,
      metadata: { reason: body.reason },
      ip,
    });
    return NextResponse.json({ ok: true });
  }

  const newStatus = statusMap[body.action];
  if (!newStatus) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await supabase
    .from("agent_reviews")
    .update({
      status: newStatus,
      moderation_reason: body.reason ?? null,
      updated_at: new Date().toISOString(),
      approved_at: newStatus === "approved" ? new Date().toISOString() : null,
      approved_by: newStatus === "approved" ? auth.user.id : null,
    })
    .eq("id", body.id);

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: `review.${body.action}`,
    target_type: "review",
    target_id: body.id,
    metadata: { reason: body.reason },
    ip,
  });

  return NextResponse.json({ ok: true });
}
