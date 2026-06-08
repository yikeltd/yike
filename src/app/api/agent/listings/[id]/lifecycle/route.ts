import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { canPublishListings } from "@/lib/account-control";
import {
  canAgentReactivate,
  computeExpiresAt,
  statusAfterAgentAction,
  type AgentListingAction,
} from "@/lib/listing-lifecycle";
import { writeAuditLog } from "@/lib/admin/audit";
import { ACCOUNT_REVIEW_BLOCKS_MESSAGE } from "@/lib/copy/user-messages";
import { friendlyPublicError, PUBLIC_ERROR_FALLBACK } from "@/lib/copy/public-errors";
import type { ListingPlan, Property } from "@/types/database";

type RouteCtx = { params: Promise<{ id: string }> };

const ACTIONS: AgentListingAction[] = [
  "mark_rented",
  "mark_sold",
  "mark_unavailable",
  "reactivate",
  "archive",
];

export async function PATCH(req: Request, ctx: RouteCtx) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as { action?: AgentListingAction };

  if (!body.action || !ACTIONS.includes(body.action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: listing } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("agent_id", user.id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const property = listing as Property;

  if (body.action === "reactivate") {
    const gate = canAgentReactivate(property);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason }, { status: 403 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned, account_status, profile_status, verification_required, role")
      .eq("id", user.id)
      .single();

    if (!canPublishListings(profile)) {
      return NextResponse.json(
        { error: ACCOUNT_REVIEW_BLOCKS_MESSAGE },
        { status: 403 }
      );
    }

    const plan = (property.listing_plan ?? "free") as ListingPlan;
    const { expiresAt, durationDays } = computeExpiresAt(plan);
    const next = statusAfterAgentAction("reactivate", property);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("properties")
      .update({
        status: next.status,
        availability_status: next.availability_status,
        expires_at: expiresAt,
        listing_duration_days: durationDays,
        expired_at: null,
        reactivated_at: now,
        last_reactivated_by: user.id,
        published_at: property.published_at ?? now,
        unavailable_at: null,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: friendlyPublicError(error.message, PUBLIC_ERROR_FALLBACK) }, { status: 500 });
    }

    const hdrs = await headers();
    await writeAuditLog({
      actor_id: user.id,
      actor_role: profile?.role ?? "agent",
      action: "listing.reactivate",
      target_type: "property",
      target_id: id,
      metadata: { plan, expiresAt },
      ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json({
      ok: true,
      message: "Your listing is active again.",
      needsReview: next.needsReview,
    });
  }

  const next = statusAfterAgentAction(body.action, property);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: next.status,
    availability_status: next.availability_status,
    unavailable_at: now,
  };

  const { error } = await supabase.from("properties").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ error: friendlyPublicError(error.message, PUBLIC_ERROR_FALLBACK) }, { status: 500 });
  }

  const hdrs = await headers();
  const auditAction =
    body.action === "mark_rented"
      ? "listing.rented"
      : body.action === "mark_sold"
        ? "listing.sold"
        : body.action === "mark_unavailable"
          ? "listing.unavailable"
          : "listing.archive";

  await writeAuditLog({
    actor_id: user.id,
    actor_role: "agent",
    action: auditAction,
    target_type: "property",
    target_id: id,
    metadata: patch,
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ ok: true });
}
