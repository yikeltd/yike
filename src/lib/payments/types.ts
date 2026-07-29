/**
 * Unified payment product purposes.
 * Maps 1:1 to payment_orders.order_type (DB check constraint).
 * Future escrow/wallet products are reserved here — do not activate in launch UI yet.
 */
export type PaymentPurpose =
  | "featured_listing"
  | "boost_listing"
  | "property_verification"
  | "verification_fee"
  | "advertisement"
  | "subscription"
  | "lead_insights"
  | "listing_fee"
  | "premium_seller"
  | "vehicle_boost"
  | "property_boost"
  | "live_inspection"
  | "escrow_hold"
  | "wallet_topup";

/** @deprecated Prefer PaymentPurpose — kept for existing callers */
export type PaymentOrderType = PaymentPurpose;

export type PaymentOrderStatus =
  | "pending"
  | "processing"
  | "successful"
  | "failed"
  | "cancelled"
  | "refunded";

export type PaymentProviderName =
  | "paystack"
  | "korapay"
  | "safehaven"
  | "flutterwave"
  | "monnify"
  | "stripe"
  | "wallet";

export type InitializePaymentInput = {
  reference: string;
  amount: number;
  currency: string;
  email: string;
  metadata?: Record<string, unknown>;
  callbackUrl: string;
};

export type InitializePaymentResult =
  | {
      ok: true;
      authorizationUrl: string;
      accessCode?: string;
      providerReference?: string;
    }
  | { ok: false; error: string };

export type VerifyPaymentResult =
  | {
      ok: true;
      status: "successful" | "failed" | "pending";
      amount: number;
      currency: string;
      paidAt?: string;
      providerReference?: string;
      channel?: string | null;
      fees?: number | null;
      metadata?: Record<string, unknown>;
      raw?: Record<string, unknown>;
    }
  | { ok: false; error: string };

export type CreatePaymentOrderInput = {
  userId: string;
  orderType: PaymentPurpose;
  amount: number;
  currency?: string;
  entityId?: string | null;
  listingId?: string | null;
  metadata?: Record<string, unknown>;
  provider?: PaymentProviderName;
};

export type PaymentStatusSnapshot = {
  id: string;
  reference: string;
  purpose: PaymentPurpose;
  status: PaymentOrderStatus;
  amount: number;
  currency: string;
  listingId: string | null;
  entityId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** True when product fulfillment has completed for a successful payment */
  fulfilled: boolean;
  metadata: Record<string, unknown>;
};

export const PAYMENT_PURPOSES: readonly PaymentPurpose[] = [
  "featured_listing",
  "boost_listing",
  "property_verification",
  "verification_fee",
  "advertisement",
  "subscription",
  "lead_insights",
  "listing_fee",
  "premium_seller",
  "vehicle_boost",
  "property_boost",
  "live_inspection",
  "escrow_hold",
  "wallet_topup",
] as const;

export function isPaymentPurpose(value: string): value is PaymentPurpose {
  return (PAYMENT_PURPOSES as readonly string[]).includes(value);
}
