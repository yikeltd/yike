export type PaymentOrderType =
  | "featured_listing"
  | "boost_listing"
  | "property_verification"
  | "subscription";

export type PaymentOrderStatus =
  | "pending"
  | "processing"
  | "successful"
  | "failed"
  | "cancelled"
  | "refunded";

export type PaymentProviderName = "paystack" | "safehaven";

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
      metadata?: Record<string, unknown>;
    }
  | { ok: false; error: string };

export type CreatePaymentOrderInput = {
  userId: string;
  orderType: PaymentOrderType;
  amount: number;
  currency?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  provider?: PaymentProviderName;
};
