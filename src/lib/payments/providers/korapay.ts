import { createHmac, timingSafeEqual } from "crypto";
import type { PaymentProvider } from "@/lib/payments/providers/types";
import type {
  InitializePaymentInput,
  InitializePaymentResult,
  VerifyPaymentResult,
} from "@/lib/payments/types";
import {
  getKorapayBaseUrl,
  getKorapaySecretKey,
  getKorapayCallbackUrl,
  isKorapayConfigured,
} from "@/lib/payments/config";

function korapayHeaders(): HeadersInit {
  const secret = getKorapaySecretKey();
  if (!secret) throw new Error("Korapay is not configured");
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
}

export function verifyKorapayWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = getKorapaySecretKey();
  if (!secret || !signatureHeader) return false;

  const hash = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(hash, "utf-8"),
      Buffer.from(signatureHeader.trim(), "utf-8")
    );
  } catch {
    return false;
  }
}

export const korapayProvider: PaymentProvider = {
  name: "korapay",

  isConfigured(): boolean {
    return isKorapayConfigured();
  },

  async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    if (!this.isConfigured()) {
      return { ok: false, error: "Korapay is not configured" };
    }

    const base = getKorapayBaseUrl();
    const callbackUrl = input.callbackUrl || getKorapayCallbackUrl();

    try {
      const res = await fetch(`${base}/merchant/api/v1/charges/initialize`, {
        method: "POST",
        headers: korapayHeaders(),
        body: JSON.stringify({
          reference: input.reference,
          amount: input.amount,
          currency: input.currency || "NGN",
          customer: {
            email: input.email,
            name: (input.metadata?.customer_name as string) || input.email,
          },
          notification_url: input.callbackUrl,
          redirect_url: callbackUrl,
          narration: (input.metadata?.narration as string) || `Yike Payment - ${input.reference}`,
          metadata: input.metadata ?? {},
        }),
      });

      const json = (await res.json()) as {
        status?: boolean;
        message?: string;
        data?: {
          checkout_url?: string;
          reference?: string;
        };
      };

      if (!res.ok || !json.status || !json.data?.checkout_url) {
        return { ok: false, error: json.message ?? "Could not initialize Korapay payment" };
      }

      return {
        ok: true,
        authorizationUrl: json.data.checkout_url,
        providerReference: json.data.reference || input.reference,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Korapay initialization failed";
      return { ok: false, error: msg };
    }
  },

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    if (!this.isConfigured()) {
      return { ok: false, error: "Korapay is not configured" };
    }

    const base = getKorapayBaseUrl();

    try {
      const res = await fetch(`${base}/merchant/api/v1/charges/${encodeURIComponent(reference)}`, {
        method: "GET",
        headers: korapayHeaders(),
      });

      const json = (await res.json()) as {
        status?: boolean;
        message?: string;
        data?: {
          reference?: string;
          status?: string;
          amount?: number;
          currency?: string;
          paid_at?: string;
          fee?: number;
          channel?: string;
          metadata?: Record<string, unknown>;
        };
      };

      if (!res.ok || !json.status || !json.data) {
        return { ok: false, error: json.message ?? "Payment verification failed" };
      }

      const d = json.data;
      const statusRaw = String(d.status || "").toLowerCase();
      const status =
        statusRaw === "success" || statusRaw === "successful"
          ? "successful"
          : statusRaw === "failed" || statusRaw === "expired" || statusRaw === "cancelled"
          ? "failed"
          : "pending";

      return {
        ok: true,
        status,
        amount: Number(d.amount ?? 0),
        currency: String(d.currency ?? "NGN").toUpperCase(),
        paidAt: d.paid_at ?? new Date().toISOString(),
        providerReference: d.reference ?? reference,
        channel: d.channel ?? "korapay",
        fees: Number(d.fee ?? 0),
        metadata: d.metadata ?? {},
        raw: json as unknown as Record<string, unknown>,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Korapay verification network error";
      return { ok: false, error: msg };
    }
  },
};
