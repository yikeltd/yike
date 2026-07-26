import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePayableProduct } from "@/lib/payments/catalog";
import {
  getDefaultPaymentProvider,
  isPaystackConfigured,
  isPaymentsRuntimeEnabled,
} from "@/lib/payments/config";
import { getFinancialPlatform } from "@/lib/financial";
import { friendlyPublicError } from "@/lib/copy/public-errors";

export const runtime = "nodejs";

/**
 * POST /api/payments/initialize
 * Creates a Pending transaction, initializes Paystack, returns checkout URL.
 * Never trusts client amount/status/reference.
 */
export async function POST(request: Request) {
  if (!isPaymentsRuntimeEnabled() || !isPaystackConfigured()) {
    return NextResponse.json(
      { error: "Payments are not available right now" },
      { status: 503 }
    );
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

  let body: {
    purpose?: string;
    listingId?: string;
    durationDays?: number;
    boostPlan?: string;
    planCode?: string;
    packageId?: string;
    amount?: unknown;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.purpose?.trim()) {
    return NextResponse.json({ error: "Purpose required" }, { status: 400 });
  }

  // Explicitly ignore any client-supplied amount
  if ("amount" in body) {
    delete body.amount;
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  const product = await resolvePayableProduct(admin, user.id, {
    purpose: body.purpose.trim(),
    listingId: body.listingId,
    durationDays: body.durationDays,
    boostPlan: body.boostPlan,
    planCode: body.planCode,
    packageId: body.packageId,
  });

  if (!product.ok) {
    const status =
      product.code === "listing_required" || product.code === "invalid_duration"
        ? 400
        : product.code === "use_dedicated_checkout"
          ? 400
          : 400;
    return NextResponse.json({ error: product.error, code: product.code }, { status });
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

  try {
    const financial = getFinancialPlatform();
    const order = await financial.payment.createOrder(admin, {
      userId: user.id,
      orderType: product.purpose,
      amount: product.amount,
      currency: product.currency,
      entityId: product.entityId,
      listingId: product.listingId,
      provider: getDefaultPaymentProvider(),
      metadata: product.metadata,
    });

    const checkout = await financial.payment.initialize(admin, order.id, email);

    return NextResponse.json({
      ok: true,
      reference: checkout.reference,
      authorizationUrl: checkout.authorizationUrl,
      amount: product.amount,
      currency: product.currency,
      purpose: product.purpose,
      status: "processing",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment could not start";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
