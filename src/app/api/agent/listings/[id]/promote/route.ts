import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFeaturedDurationDays } from "@/lib/featured-promotions/constants";
import { createFeaturedPromotion } from "@/lib/featured-promotions/service";
import {
  isFeaturedListingsEnabled,
  isFeaturedPaymentsEnabled,
} from "@/lib/feature-flags";
import { friendlyPublicError } from "@/lib/copy/public-errors";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteCtx) {
  if (!isFeaturedListingsEnabled()) {
    return NextResponse.json({ error: "Feature unavailable" }, { status: 404 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: { durationDays?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const durationDays = Number(body.durationDays);
  if (!isFeaturedDurationDays(durationDays)) {
    return NextResponse.json({ error: "Choose 7 or 30 days" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  const result = await createFeaturedPromotion(admin, {
    listingId: id,
    userId: user.id,
    durationDays,
  });

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "not_approved" || result.code === "listing_expired"
          ? 400
          : 409;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    promotion: result.promotion,
    paymentsEnabled: isFeaturedPaymentsEnabled(),
    message: isFeaturedPaymentsEnabled()
      ? "Continue to payment"
      : "Payment integration coming online. Admin activation only.",
  });
}
