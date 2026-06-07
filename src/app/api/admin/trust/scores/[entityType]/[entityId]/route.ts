import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import {
  adminOverrideTrustScore,
  upsertCalculatedTrustScore,
} from "@/lib/trust/score-engine/recalculate";
import type { TrustEntityType } from "@/lib/trust/score-engine/constants";

type RouteCtx = { params: Promise<{ entityType: string; entityId: string }> };

const VALID_TYPES = new Set([
  "agent",
  "company",
  "listing",
  "field_verifier",
  "legal_partner",
  "service_provider",
]);

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { entityType, entityId } = await ctx.params;
  if (!VALID_TYPES.has(entityType)) {
    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: score } = await admin
    .from("trust_scores")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();

  const { data: events } = await admin
    .from("trust_score_events")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(30);

  return NextResponse.json({ score: score ?? null, events: events ?? [] });
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

  const { entityType, entityId } = await ctx.params;
  if (!VALID_TYPES.has(entityType)) {
    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  }

  const body = (await req.json()) as {
    action?: "freeze" | "unfreeze" | "reset" | "override" | "escalate" | "mark_trusted" | "recalculate";
    trustScore?: number;
    riskScore?: number;
    trustLevel?: string;
    adminNotes?: string;
  };

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  if (body.action === "recalculate") {
    await upsertCalculatedTrustScore(admin, entityType as TrustEntityType, entityId);
  } else if (body.action) {
    await adminOverrideTrustScore(admin, {
      entityType: entityType as TrustEntityType,
      entityId,
      actorId: auth.user.id,
      action: body.action,
      trustScore: body.trustScore,
      riskScore: body.riskScore,
      trustLevel: body.trustLevel,
      adminNotes: body.adminNotes,
    });
  } else {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "trust.score.override",
    target_type: entityType,
    target_id: entityId,
    metadata: { action: body.action, ...body },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  const { data: score } = await admin
    .from("trust_scores")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();

  return NextResponse.json({ ok: true, score });
}
