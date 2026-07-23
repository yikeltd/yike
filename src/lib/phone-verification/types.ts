/** Delivery channels for phone / contact verification. SMS is production-primary. */
export type PhoneVerificationChannel = "sms" | "whatsapp" | "email";

export type PhoneOtpSendResult =
  | {
      ok: true;
      channel: PhoneVerificationChannel;
      reference: string;
      expiresMinutes: number;
      message: string;
    }
  | {
      ok: false;
      error: string;
      status: number;
      code?: "provider_auth_failed" | "rate_limited" | "cooldown" | "not_configured";
    };

export type PhoneOtpConfirmResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/**
 * Provider interface — SMS now; WhatsApp / email later without changing business logic.
 */
export type PhoneVerificationProvider = {
  readonly id: string;
  readonly supportedChannels: readonly PhoneVerificationChannel[];
  isConfigured(): boolean;
  sendOtp(params: {
    phoneIntl: string;
    channel: PhoneVerificationChannel;
    email?: string;
    purpose: string;
  }): Promise<PhoneOtpSendResult>;
  confirmOtp(params: {
    reference: string;
    code: string;
  }): Promise<PhoneOtpConfirmResult>;
};
