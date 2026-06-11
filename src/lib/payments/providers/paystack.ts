import { createHmac, timingSafeEqual } from "crypto";
import type { PaymentProvider } from "@/lib/payments/providers/types";
import type {
  InitializePaymentInput,
  InitializePaymentResult,
  VerifyPaymentResult,
} from "@/lib/payments/types";
import { getPaystackSecretKey } from "@/lib/payments/config";

const PAYSTACK_BASE = "https://api.paystack.co";

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

export const paystackProvider: PaymentProvider = {
  name: "paystack",

  isConfigured(): boolean {
    return Boolean(getPaystackSecretKey());
  },

  async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    if (!this.isConfigured()) {
      return { ok: false, error: "Paystack is not configured" };
    }

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
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

    const res = await fetch(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
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
        metadata?: Record<string, unknown>;
      };
    };

    if (!res.ok || !json.status || !json.data) {
      return { ok: false, error: json.message ?? "Verification failed" };
    }

    const providerStatus = json.data.status ?? "pending";
    const mapped =
      providerStatus === "success"
        ? "successful"
        : providerStatus === "failed"
          ? "failed"
          : "pending";

    return {
      ok: true,
      status: mapped,
      amount: fromKobo(json.data.amount ?? 0),
      currency: json.data.currency ?? "NGN",
      paidAt: json.data.paid_at,
      providerReference: json.data.reference ?? reference,
      metadata: json.data.metadata,
    };
  },

  verifyWebhookSignature(rawBody: string, requestHeaders: Headers): boolean {
    const secret = getPaystackSecretKey();
    if (!secret) return false;

    const signature = requestHeaders.get("x-paystack-signature");
    if (!signature) return false;

    const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
    } catch {
      return false;
    }
  },
};
