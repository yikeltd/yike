import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isBoostPlanId,
  isFeaturedDurationDays,
  type PromotionType,
} from "@/lib/featured-promotions/constants";
import {
  createBoostPromotion,
  createFeaturedPromotion,
} from "@/lib/featured-promotions/service";
import {
  isFeaturedListingsEnabled,
  isFeaturedPaymentsEnabled,
} from "@/lib/feature-flags";
import { isPaystackConfigured } from "@/lib/payments/config";
import {
  createPaymentOrder,
  initializePayment,
} from "@/lib/payments/services/payment-service";
import type { PaymentOrderType } from "@/lib/payments/types";
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
  let body: {
    promotionType?: PromotionType;
    durationDays?: number;
    boostPlan?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const promotionType: PromotionType =
    body.promotionType === "boost" ? "boost" : "featured";

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  let result:
    | Awaited<ReturnType<typeof createBoostPromotion>>
    | Awaited<ReturnType<typeof createFeaturedPromotion>>;

  if (promotionType === "boost") {
    const plan = body.boostPlan ?? "";
    if (!isBoostPlanId(plan)) {
      return NextResponse.json({ error: "Choose a boost duration", code: "invalid_duration" }, { status: 400 });
    }
    result = await createBoostPromotion(admin, {
      listingId: id,
      userId: user.id,
      plan,
    });
  } else {
    const durationDays = Number(body.durationDays);
    if (!isFeaturedDurationDays(durationDays)) {
      return NextResponse.json({ error: "Choose 7 or 30 days", code: "invalid_duration" }, { status: 400 });
    }
    result = await createFeaturedPromotion(admin, {
      listingId: id,
      userId: user.id,
      durationDays,
    });
  }

  if (!result.ok) {
    const status =
      result.code === "not_found"
        ? 404
        : result.code === "not_approved" || result.code === "listing_expired"
          ? 400
          : 409;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  const paymentsEnabled = isFeaturedPaymentsEnabled() && isPaystackConfigured();

  if (!paymentsEnabled) {
    return NextResponse.json({
      promotion: result.promotion,
      paymentsEnabled: false,
      message: "Payment integration coming online. Admin activation only.",
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  const email = profile?.email ?? user.email;
  if (!email) {
    return NextResponse.json(
      { error: "Add an email to your profile before paying" },
      { status: 400 }
    );
  }

  const orderType: PaymentOrderType =
    promotionType === "boost" ? "boost_listing" : "featured_listing";

  const order = await createPaymentOrder(admin, {
    userId: user.id,
    orderType,
    amount: Number(result.promotion.amount),
    currency: result.promotion.currency,
    entityId: result.promotion.id,
    provider: "paystack",
    metadata: {
      listing_id: id,
      promotion_id: result.promotion.id,
      promotion_type: promotionType,
      duration_days: result.promotion.duration_days,
      duration_hours: result.promotion.duration_hours,
      user_id: user.id,
    },
  });

  try {
    const checkout = await initializePayment(admin, order.id, email);
    return NextResponse.json({
      promotion: result.promotion,
      payment: {
        reference: checkout.reference,
        authorizationUrl: checkout.authorizationUrl,
      },
      paymentsEnabled: true,
      message: "Continue to payment",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment could not start";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
