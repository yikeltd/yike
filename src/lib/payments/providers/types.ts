import type {
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentProviderName,
  VerifyPaymentResult,
} from "@/lib/payments/types";

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  isConfigured(): boolean;
  initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult>;
  verifyPayment(reference: string): Promise<VerifyPaymentResult>;
  verifyWebhookSignature?(rawBody: string, headers: Headers): boolean;
}
