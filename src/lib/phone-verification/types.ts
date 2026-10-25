/** Phone ownership verification — Sendchamp SMS only. */
export type PhoneVerificationChannel = "sms";

export type PhoneOtpDeliveryMode = "provider" | "dev_console";

export type SmsProviderFailureCategory =
  | "authentication"
  | "invalid_number"
  | "provider_rejection"
  | "network"
  | "not_configured"
  | "unknown";

export type PhoneOtpSendResult =
  | {
      ok: true;
      channel: PhoneVerificationChannel;
      reference: string;
      expiresMinutes: number;
      message: string;
      deliveryMode: PhoneOtpDeliveryMode;
    }
  | {
      ok: false;
      error: string;
      status: number;
      code?: "provider_auth_failed" | "rate_limited" | "cooldown" | "not_configured";
      failureCategory?: SmsProviderFailureCategory;
    };

export type PhoneOtpConfirmResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export type PhoneVerificationProvider = {
  readonly id: string;
  readonly supportedChannels: readonly PhoneVerificationChannel[];
  isConfigured(): boolean;
  sendOtp(params: {
    phoneIntl: string;
    channel: PhoneVerificationChannel;
    email?: string;
    purpose: string;
    requestId?: string;
  }): Promise<PhoneOtpSendResult>;
  confirmOtp(params: {
    reference: string;
    code: string;
    requestId?: string;
  }): Promise<PhoneOtpConfirmResult>;
};
