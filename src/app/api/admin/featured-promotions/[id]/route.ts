import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  activateFeaturedPromotion,
  cancelFeaturedPromotion,
  expireFeaturedPromotion,
} from "@/lib/featured-promotions/service";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

const ACTIONS = ["activate", "expire", "cancel"] as const;
type Action = (typeof ACTIONS)[number];

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
  let body: { action?: Action } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.action || !ACTIONS.includes(body.action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const result =
    body.action === "activate"
      ? await activateFeaturedPromotion(admin, id, auth.user.id)
      : body.action === "expire"
        ? await expireFeaturedPromotion(admin, id)
        : await cancelFeaturedPromotion(admin, id);

  if (!result.ok) {
    const status = result.code === "not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: `featured_promotion.${body.action}`,
    target_type: "listing_promotion",
    target_id: id,
    metadata: {
      listing_id: result.promotion.listing_id,
      promotion_reference: result.promotion.promotion_reference,
      status: result.promotion.status,
    },
    ip,
  });

  return NextResponse.json({ promotion: result.promotion });
}
