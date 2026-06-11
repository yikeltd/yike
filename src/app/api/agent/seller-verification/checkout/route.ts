import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canListProperties } from "@/lib/agent-tiers";
import { BUSINESS_VERIFICATION_FEE_NGN } from "@/lib/seller-verification/constants";
import {
  createBusinessVerificationFromPayment,
  hasBlockingBusinessVerification,
  validateCheckoutDocuments,
} from "@/lib/seller-verification/service";
import {
  isBusinessSellerType,
  type SellerVerificationDocuments,
} from "@/lib/seller-verification/levels";
import {
  isFeaturedPaymentsEnabled,
} from "@/lib/feature-flags";
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

  let body: { documents?: SellerVerificationDocuments } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const documents = body.documents;
  if (!documents) {
    return NextResponse.json({ error: "Documents required" }, { status: 400 });
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
  if (!canListProperties(profile)) {
    return NextResponse.json({ error: "Lister account required" }, { status: 403 });
  }

  if (profile.seller_verification_level === "business") {
    return NextResponse.json(
      { error: "You are already Business Verified." },
      { status: 409 }
    );
  }

  if (await hasBlockingBusinessVerification(admin, user.id)) {
    return NextResponse.json(
      { error: "You already have a verification request in progress." },
      { status: 409 }
    );
  }

  const docError = validateCheckoutDocuments(profile, {
    ...documents,
    seller_type: isBusinessSellerType(profile) ? "business" : "agent",
  });
  if (docError) {
    return NextResponse.json({ error: docError }, { status: 400 });
  }

  const paymentsLive = isFeaturedPaymentsEnabled() && isPaystackConfigured();

  if (!paymentsLive) {
    const direct = await createBusinessVerificationFromPayment(admin, {
      userId: user.id,
      paymentOrderId: "",
      documents: {
        ...documents,
        seller_type: isBusinessSellerType(profile) ? "business" : "agent",
      },
    });
    if (!direct.ok) {
      return NextResponse.json({ error: direct.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      verificationId: direct.verification.id,
      paymentsLive: false,
    });
  }

  const order = await createPaymentOrder(admin, {
    userId: user.id,
    orderType: "verification_fee",
    amount: BUSINESS_VERIFICATION_FEE_NGN,
    metadata: {
      documents: {
        ...documents,
        seller_type: isBusinessSellerType(profile) ? "business" : "agent",
      },
    },
  });

  const email = user.email ?? profile.email ?? "";
  const init = await initializePayment(admin, order.id, email);
  if (!init.authorizationUrl) {
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    reference: order.reference,
    authorizationUrl: init.authorizationUrl,
    amount: BUSINESS_VERIFICATION_FEE_NGN,
    paymentsLive: true,
  });
}
