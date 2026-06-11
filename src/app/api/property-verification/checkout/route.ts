import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { packageAmount, isPackageId } from "@/lib/property-verification/packages";
import { createPaidVerificationOrder } from "@/lib/property-verification/orders";
import { isFeaturedPaymentsEnabled } from "@/lib/feature-flags";
import { isPaystackConfigured } from "@/lib/payments/config";
import {
  createPaymentOrder,
  initializePayment,
} from "@/lib/payments/services/payment-service";
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

  let body: { requestId?: string; packageType?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const requestId = String(body.requestId ?? "").trim();
  const packageType = String(body.packageType ?? "").trim();

  if (!requestId || !isPackageId(packageType)) {
    return NextResponse.json({ error: "Choose a verification package" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: friendlyPublicError("unavailable") }, { status: 503 });
  }

  const { data: verificationRequest } = await admin
    .from("property_verification_requests")
    .select("id, requester_user_id, buyer_email, payment_status, property_title")
    .eq("id", requestId)
    .single();

  if (!verificationRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (
    user?.id &&
    verificationRequest.requester_user_id &&
    verificationRequest.requester_user_id !== user.id
  ) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (verificationRequest.payment_status === "paid") {
    return NextResponse.json({ error: "This request is already paid" }, { status: 409 });
  }

  const amount = packageAmount(packageType);
  const userId = user?.id ?? verificationRequest.requester_user_id;
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to complete payment, or contact support with your reference." },
      { status: 401 }
    );
  }

  const paymentsLive = isFeaturedPaymentsEnabled() && isPaystackConfigured();

  if (!paymentsLive) {
    const direct = await createPaidVerificationOrder(admin, {
      userId,
      requestId,
      packageType,
      paymentOrderId: "",
      paymentReference: `offline-${requestId.slice(0, 8)}`,
    });
    if (!direct.ok) {
      return NextResponse.json({ error: direct.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      orderId: direct.order.id,
      verificationReference: direct.order.verification_reference,
      paymentsLive: false,
    });
  }

  const paymentOrder = await createPaymentOrder(admin, {
    userId,
    orderType: "property_verification",
    amount,
    metadata: {
      request_id: requestId,
      package_type: packageType,
      property_title: verificationRequest.property_title,
    },
  });

  const email = user?.email ?? verificationRequest.buyer_email ?? "";
  const init = await initializePayment(admin, paymentOrder.id, email);
  if (!init.authorizationUrl) {
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    orderId: paymentOrder.id,
    reference: paymentOrder.reference,
    authorizationUrl: init.authorizationUrl,
    amount,
    paymentsLive: true,
  });
}
