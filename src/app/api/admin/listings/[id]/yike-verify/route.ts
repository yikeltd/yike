import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { YikeVerificationLevel } from "@/types/database";

type RouteCtx = { params: Promise<{ id: string }> };

const LEVELS: YikeVerificationLevel[] = [
  "basic",
  "physical",
  "document_review",
  "developer_partner",
];

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
    yike_verified: boolean;
    yike_verification_level?: YikeVerificationLevel | null;
    reason?: string | null;
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: existing } = await supabase
    .from("properties")
    .select("id, yike_verified, yike_verification_level, yike_verified_at, yike_verified_by")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const verified = !!body.yike_verified;
  const level =
    verified && body.yike_verification_level && LEVELS.includes(body.yike_verification_level)
      ? body.yike_verification_level
      : verified
        ? "basic"
        : null;

  const patch = {
    yike_verified: verified,
    yike_verification_level: level,
    yike_verified_at: verified ? now : null,
    yike_verified_by: verified ? auth.user.id : null,
    updated_at: now,
  };

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

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "listing.yike_verify",
    target_type: "property",
    target_id: id,
    metadata: {
      reason: body.reason ?? null,
      old: {
        yike_verified: existing.yike_verified,
        yike_verification_level: existing.yike_verification_level,
      },
      new: patch,
    },
    ip,
  });

  return NextResponse.json({ listing: data });
}
