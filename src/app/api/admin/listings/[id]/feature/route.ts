import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAmbassadorCommission } from "@/lib/ambassador/commission";
import type { FeaturedTier } from "@/types/database";
import type { RevenueSourceType } from "@/lib/ambassador/constants";

type RouteCtx = { params: Promise<{ id: string }> };

const TIERS: FeaturedTier[] = ["basic", "premium", "launch", "developer"];

export async function POST(req: Request, ctx: RouteCtx) {
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
    action: "feature" | "unfeature";
    featured_until?: string | null;
    featured_tier?: FeaturedTier | null;
    featured_reason?: string | null;
    net_revenue?: number;
    gross_revenue?: number;
    payment_reference?: string;
  };

  if (body.action !== "feature" && body.action !== "unfeature") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (body.featured_tier && !TIERS.includes(body.featured_tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: existing } = await supabase
    .from("properties")
    .select(
      "id, title, agent_id, is_featured, featured_until, featured_tier, featured_reason, featured_by, featured_created_at"
    )
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  let patch: Record<string, unknown>;
  let auditAction: "listing.feature" | "listing.unfeature";

  if (body.action === "unfeature") {
    patch = {
      is_featured: false,
      featured_until: null,
      featured_tier: null,
      featured_reason: null,
      featured_by: null,
      featured_created_at: null,
      boost_score: 0,
      sponsored_status: "none",
      updated_at: now,
    };
    auditAction = "listing.unfeature";
  } else {
    const featuredUntil =
      body.featured_until ??
      new Date(Date.now() + 14 * 86_400_000).toISOString();
    patch = {
      status: "approved",
      is_featured: true,
      featured_until: featuredUntil,
      featured_tier: body.featured_tier ?? "basic",
      featured_reason: body.featured_reason?.trim() || null,
      featured_by: auth.user.id,
      featured_created_at: existing.featured_created_at ?? now,
      boost_score: 50,
      sponsored_status: "boosted",
      updated_at: now,
    };
    auditAction = "listing.feature";
  }

  const { data, error } = await supabase
    .from("properties")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (body.action === "feature" && body.net_revenue && body.net_revenue > 0 && existing.agent_id) {
    const paymentRef =
      body.payment_reference?.trim() ||
      `featured:${id}:${Date.now()}`;
    await recordAmbassadorCommission(supabase, {
      sourceUserId: existing.agent_id as string,
      revenueSourceType: "featured_listing" as RevenueSourceType,
      paymentReference: paymentRef,
      grossAmount: body.gross_revenue ?? body.net_revenue,
      netAmount: body.net_revenue,
    });
  }

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: auditAction,
    target_type: "property",
    target_id: id,
    metadata: {
      reason: body.featured_reason ?? null,
      old: {
        is_featured: existing.is_featured,
        featured_until: existing.featured_until,
        featured_tier: existing.featured_tier,
        featured_reason: existing.featured_reason,
      },
      new: {
        is_featured: patch.is_featured,
        featured_until: patch.featured_until,
        featured_tier: patch.featured_tier,
        featured_reason: patch.featured_reason,
      },
    },
    ip,
  });

  return NextResponse.json({ listing: data });
}
