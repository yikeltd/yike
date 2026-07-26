import { createHmac, timingSafeEqual } from "crypto";
import type { PaymentProvider } from "@/lib/payments/providers/types";
import type {
  InitializePaymentInput,
  InitializePaymentResult,
  VerifyPaymentResult,
} from "@/lib/payments/types";
import {
  getPaystackBaseUrl,
  getPaystackSecretKey,
} from "@/lib/payments/config";

function headers(): HeadersInit {
  const secret = getPaystackSecretKey();
  if (!secret) throw new Error("Paystack not configured");
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
}

function toKobo(amountNaira: number): number {
  return Math.round(amountNaira * 100);
}

function fromKobo(kobo: number): number {
  return kobo / 100;
}

function sanitizeGatewayResponse(data: Record<string, unknown>): Record<string, unknown> {
  const {
    authorization: _authorization,
    customer: customerRaw,
    ...rest
  } = data;

  const customer =
    customerRaw && typeof customerRaw === "object"
      ? {
          id: (customerRaw as Record<string, unknown>).id ?? null,
          email: (customerRaw as Record<string, unknown>).email ?? null,
          customer_code: (customerRaw as Record<string, unknown>).customer_code ?? null,
        }
      : null;

  return {
    ...rest,
    customer,
    // Never persist card authorization details
  };
}

export const paystackProvider: PaymentProvider = {
  name: "paystack",

  isConfigured(): boolean {
    return Boolean(getPaystackSecretKey());
  },

  async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    if (!this.isConfigured()) {
      return { ok: false, error: "Paystack is not configured" };
    }

    const base = getPaystackBaseUrl();
    const res = await fetch(`${base}/transaction/initialize`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        email: input.email,
        amount: toKobo(input.amount),
        currency: input.currency || "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata ?? {},
      }),
    });

    const json = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: {
        authorization_url?: string;
        access_code?: string;
        reference?: string;
      };
    };

    if (!res.ok || !json.status || !json.data?.authorization_url) {
      return { ok: false, error: json.message ?? "Could not initialize payment" };
    }

    return {
      ok: true,
      authorizationUrl: json.data.authorization_url,
      accessCode: json.data.access_code,
      providerReference: json.data.reference,
    };
  },

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    if (!this.isConfigured()) {
      return { ok: false, error: "Paystack is not configured" };
    }

    const base = getPaystackBaseUrl();
    const res = await fetch(
      `${base}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: headers(), cache: "no-store" }
    );

    const json = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: {
        status?: string;
        amount?: number;
        currency?: string;
        paid_at?: string;
        reference?: string;
        channel?: string;
        fees?: number;
        metadata?: Record<string, unknown>;
        [key: string]: unknown;
      };
    };

    if (!res.ok || !json.status || !json.data) {
      return { ok: false, error: json.message ?? "Verification failed" };
    }

    const providerStatus = json.data.status ?? "pending";
    const mapped =
      providerStatus === "success"
        ? "successful"
        : providerStatus === "failed" || providerStatus === "abandoned"
          ? "failed"
          : "pending";

    const feesKobo =
      typeof json.data.fees === "number" && Number.isFinite(json.data.fees)
        ? json.data.fees
        : null;

    return {
      ok: true,
      status: mapped,
      amount: fromKobo(json.data.amount ?? 0),
      currency: json.data.currency ?? "NGN",
      paidAt: json.data.paid_at,
      providerReference: json.data.reference ?? reference,
      channel: json.data.channel ?? null,
      fees: feesKobo != null ? fromKobo(feesKobo) : null,
      metadata: json.data.metadata,
      raw: sanitizeGatewayResponse(json.data as Record<string, unknown>),
    };
  },

  /**
   * Paystack signs webhooks with HMAC-SHA512(raw_body, PAYSTACK_SECRET_KEY).
   * There is no separate webhook secret — same key as API calls.
   */
  verifyWebhookSignature(rawBody: string, requestHeaders: Headers): boolean {
    const secret = getPaystackSecretKey();
    if (!secret) return false;

    const signature = requestHeaders.get("x-paystack-signature")?.trim();
    if (!signature || !/^[a-f0-9]+$/i.test(signature)) return false;

    const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
    if (expected.length !== signature.length) return false;

    try {
      return timingSafeEqual(
        Buffer.from(expected, "hex"),
        Buffer.from(signature, "hex")
      );
    } catch {
      return false;
    }
  },
};
