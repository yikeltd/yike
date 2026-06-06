import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { countAsActiveListing } from "@/lib/agent-tiers";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: agent, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const { data: listings } = await supabase
    .from("properties")
    .select("id, status, expires_at")
    .eq("agent_id", id);

  const activeListingCount = (listings ?? []).filter((p) =>
    countAsActiveListing(p.status, p.expires_at)
  ).length;

  const [{ count: leadCount }, { count: reviewCount }, { count: reportCount }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", id),
      supabase
        .from("agent_reviews")
        .select("id", { count: "exact", head: true })
        .or(`agent_id.eq.${id},company_id.eq.${id}`),
      supabase
        .from("listing_reports")
        .select("id", { count: "exact", head: true })
        .eq("property_id", id),
    ]);

  return NextResponse.json({
    agent,
    stats: {
      active_listing_count: activeListingCount,
      total_listings: listings?.length ?? 0,
      leads: leadCount ?? 0,
      reviews: reviewCount ?? 0,
      reports: reportCount ?? 0,
    },
  });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    listing_limit?: number | null;
    full_name?: string;
    phone?: string;
    whatsapp?: string;
    plan?: string;
    profile_status?: string;
    verification_status?: string;
    role?: string;
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const patch: Record<string, unknown> = {};
  if (body.listing_limit !== undefined) patch.listing_limit = body.listing_limit;
  if (body.full_name !== undefined) patch.full_name = body.full_name;
  if (body.phone !== undefined) patch.phone = body.phone;
  if (body.whatsapp !== undefined) patch.whatsapp = body.whatsapp;
  if (body.plan !== undefined) patch.plan = body.plan;
  if (body.profile_status !== undefined) patch.profile_status = body.profile_status;
  if (body.verification_status !== undefined) {
    patch.verification_status = body.verification_status;
  }
  if (body.role !== undefined) patch.role = body.role;

  const { data, error } = await supabase
    .from("profiles")
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
    action: body.listing_limit !== undefined ? "agent.listing_limit" : "agent.approve",
    target_type: "profile",
    target_id: id,
    metadata: patch,
    ip,
  });

  return NextResponse.json({ agent: data });
}
