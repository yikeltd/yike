import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAdminProfileStats } from "@/lib/admin/profile-stats";

export const runtime = "nodejs";

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

  const stats = await fetchAdminProfileStats(supabase, id);

  return NextResponse.json({
    agent,
    stats,
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
    listing_limit_reason?: string | null;
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
  if (body.listing_limit !== undefined) {
    patch.listing_limit = body.listing_limit;
    patch.listing_limit_updated_at = new Date().toISOString();
    patch.listing_limit_updated_by = auth.user.id;
    if (body.listing_limit_reason !== undefined) {
      patch.listing_limit_reason = body.listing_limit_reason;
    }
  }
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
