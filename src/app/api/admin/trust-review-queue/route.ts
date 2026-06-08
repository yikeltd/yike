import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { escalateUserTrust } from "@/lib/verification/escalate";
import { fetchTrustReviewQueue } from "@/lib/verification/review-queue";
import type { AdaptiveTrustLevel, TrustReviewAction } from "@/lib/verification/constants";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(req.url);
  const limit = Math.min(120, Math.max(10, Number(url.searchParams.get("limit") ?? 80)));

  const items = await fetchTrustReviewQueue(admin, limit);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = (await req.json()) as {
    userId: string;
    level?: AdaptiveTrustLevel;
    reason?: string;
    caseType?: string;
    listingId?: string;
  };

  if (!body.userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const level = (body.level ?? 4) as AdaptiveTrustLevel;
  const reason = String(body.reason ?? "").trim() || "Escalated by Yike trust review";

  const result = await escalateUserTrust(admin, {
    userId: body.userId,
    level,
    reason,
    openedBy: auth.user.id,
    caseType: body.caseType ?? "manual",
    listingId: body.listingId ?? null,
  });

  if (!result) {
    return NextResponse.json({ error: "Escalation failed" }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "trust.verification.escalate",
    target_type: "profile",
    target_id: body.userId,
    metadata: { level, reason, caseId: result.caseId, reference: result.reference },
    ip,
  });

  return NextResponse.json({ ok: true, ...result });
}

export type { TrustReviewAction };
