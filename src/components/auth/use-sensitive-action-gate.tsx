"use client";

import { useCallback, useRef, useState } from "react";
import { EmailOtpModal } from "@/components/auth/email-otp-modal";
import { useSensitiveConfirm } from "@/components/auth/sensitive-confirm-modal";

export type SensitiveGateResult =
  | { ok: true; confirmationToken?: string }
  | { ok: false };

export function useSensitiveActionGate(userEmail: string | null | undefined) {
  const { confirmSensitiveAction, sensitiveConfirmModal } = useSensitiveConfirm();
  const [otpOpen, setOtpOpen] = useState(false);
  const otpResolverRef = useRef<((ok: boolean) => void) | null>(null);

  const waitForOtp = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      otpResolverRef.current = resolve;
      setOtpOpen(true);
    });
  }, []);

  const gateSensitiveAction = useCallback(
    async (action: string): Promise<SensitiveGateResult> => {
      const result = await confirmSensitiveAction(action);
      if (!result.ok) return { ok: false };

      if (result.requiresOtp) {
        if (!userEmail?.includes("@")) {
          return { ok: false };
        }
        const otpOk = await waitForOtp();
        if (!otpOk) return { ok: false };
      }

      return { ok: true, confirmationToken: result.confirmationToken };
    },
    [confirmSensitiveAction, userEmail, waitForOtp]
  );

  const modals = (
    <>
      {sensitiveConfirmModal}
      {userEmail ? (
        <EmailOtpModal
          open={otpOpen}
          email={userEmail}
          purpose="email_verify"
          onClose={() => {
            setOtpOpen(false);
            otpResolverRef.current?.(false);
            otpResolverRef.current = null;
          }}
          onVerified={() => {
            setOtpOpen(false);
            otpResolverRef.current?.(true);
            otpResolverRef.current = null;
          }}
          autoSend
        />
      ) : null}
    </>
  );

  return { gateSensitiveAction, sensitiveActionModals: modals };
}
