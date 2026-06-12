import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPlanByCode,
  canSubscribe,
  activateSubscriptionFromPayment,
} from "@/lib/subscriptions/service";
import { isPaidPlan, isSubscriptionPlanCode } from "@/lib/subscriptions/constants";
import {
  calculateSubscriptionBilling,
  findBillingTerm,
  listBillingTerms,
} from "@/lib/subscriptions/billing-terms";
import { isFeaturedPaymentsEnabled } from "@/lib/feature-flags";
import { isPaystackConfigured } from "@/lib/payments/config";
import {
  createPaymentOrder,
  initializePayment,
} from "@/lib/payments/services/payment-service";
import type { Profile } from "@/types/database";
import { friendlyPublicError } from "@/lib/copy/public-errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  let body: { planCode?: string; billingMonths?: number } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const planCode = String(body.planCode ?? "").trim();
  const rawBillingMonths = Number(body.billingMonths);
  if (!isSubscriptionPlanCode(planCode) || !isPaidPlan(planCode)) {
    return NextResponse.json({ error: "Choose a paid plan" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  const { data: profileRow } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profileRow) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const profile = profileRow as Profile;
  if (!canSubscribe(profile)) {
    return NextResponse.json(
      { error: "Subscriptions are for agents, agencies, and developers." },
      { status: 403 }
    );
  }

  const plan = await getPlanByCode(admin, planCode);
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const billingTerms = await listBillingTerms(admin);
  const billingMonths = findBillingTerm(billingTerms, rawBillingMonths)?.months ?? billingTerms[0]?.months ?? 1;
  const billing = calculateSubscriptionBilling(plan.monthly_price, billingMonths, billingTerms);

  const paymentsLive = isFeaturedPaymentsEnabled() && isPaystackConfigured();

  if (!paymentsLive) {
    const result = await activateSubscriptionFromPayment(admin, {
      userId: user.id,
      planCode,
      paymentOrderId: "",
      paymentReference: `offline-${user.id.slice(0, 8)}`,
      durationDays: billing.durationDays,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, paymentsLive: false, subscription: result.subscription });
  }

  const order = await createPaymentOrder(admin, {
    userId: user.id,
    orderType: "subscription",
    amount: billing.total,
    entityId: plan.id,
    metadata: {
      plan_code: planCode,
      duration_days: billing.durationDays,
      billing_months: billing.months,
      discount_percent: billing.discountPercent,
      user_id: user.id,
    },
  });

  const email = user.email ?? profile.email ?? "";
  const init = await initializePayment(admin, order.id, email);
  if (!init.authorizationUrl) {
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    authorizationUrl: init.authorizationUrl,
    reference: order.reference,
    amount: billing.total,
    billingMonths: billing.months,
    discountPercent: billing.discountPercent,
    paymentsLive: true,
  });
}
