/**
 * Payment module — application code talks here, never to Paystack directly.
 * Adapters load lazily so YIP unit tests can boot without Next `server-only`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";
import {
  isPaystackConfigured,
  isPaymentsRuntimeEnabled,
} from "@/lib/payments/config";
import { isPaymentsEnabled } from "../flags";
import type { ModuleHealth } from "../types";
import type { CreatePaymentOrderInput } from "@/lib/payments/types";
import type { PaymentOrder } from "@/types/database";
import type { PaymentFulfillmentResult } from "@/lib/payments/services/payment-service";

type PaymentService = typeof import("@/lib/payments/services/payment-service");
type PaystackWebhooks = typeof import("@/lib/payments/webhooks/paystack");

async function paymentService(): Promise<PaymentService> {
  return import("@/lib/payments/services/payment-service");
}

async function paystackWebhooks(): Promise<PaystackWebhooks> {
  return import("@/lib/payments/webhooks/paystack");
}

export type PaymentStatusResult = Awaited<
  ReturnType<PaymentService["getPaymentStatus"]>
>;

export type PaymentModule = {
  isEnabled: () => boolean;
  createOrder: (
    admin: SupabaseClient,
    input: CreatePaymentOrderInput
  ) => Promise<PaymentOrder>;
  initialize: (
    admin: SupabaseClient,
    orderId: string,
    email: string
  ) => Promise<{ authorizationUrl: string; reference: string }>;
  reconcile: (
    admin: SupabaseClient,
    reference: string
  ) => Promise<PaymentFulfillmentResult>;
  status: (
    admin: SupabaseClient,
    reference: string
  ) => Promise<PaymentStatusResult>;
  refund: (
    admin: SupabaseClient,
    orderId: string
  ) => Promise<PaymentOrder | null>;
  processWebhook: (
    request: Request,
    logTag?: string
  ) => Promise<NextResponse>;
  health: () => ModuleHealth;
};

export function createPaymentModule(): PaymentModule {
  return {
    isEnabled: () => isPaymentsEnabled(),
    createOrder: async (admin, input) => {
      const svc = await paymentService();
      return svc.createPaymentOrder(admin, input);
    },
    initialize: async (admin, orderId, email) => {
      const svc = await paymentService();
      return svc.initializePayment(admin, orderId, email);
    },
    reconcile: async (admin, reference) => {
      const svc = await paymentService();
      return svc.reconcileAndFulfillPayment(admin, reference);
    },
    status: async (admin, reference) => {
      const svc = await paymentService();
      return svc.getPaymentStatus(admin, reference);
    },
    refund: async (admin, orderId) => {
      const svc = await paymentService();
      return svc.refundPayment(admin, orderId);
    },
    processWebhook: async (request, logTag) => {
      const wh = await paystackWebhooks();
      return wh.processPaystackWebhookPost(
        request,
        logTag ?? "financial.payment webhook"
      );
    },
    health: () => {
      const enabled = isPaymentsEnabled();
      if (!enabled) {
        return {
          id: "payment",
          label: "Payment",
          status: "disabled",
          detail: "ENABLE_PAYMENTS / ENABLE_FEATURED_PAYMENTS off",
          enabled: false,
        };
      }
      const configured = isPaystackConfigured() && isPaymentsRuntimeEnabled();
      return {
        id: "payment",
        label: "Payment",
        status: configured ? "healthy" : "warning",
        detail: configured
          ? "Runtime on · Paystack provider ready"
          : "Payments enabled · Paystack incomplete",
        enabled: true,
      };
    },
  };
}
