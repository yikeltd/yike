import { verifySensitiveConfirmationToken } from "@/lib/auth/sensitive-token";

export function parseSensitiveConfirmationToken(
  body: Record<string, unknown>
): string | null {
  const raw = body.sensitiveConfirmationToken ?? body.confirmationToken;
  if (raw == null) return null;
  const token = String(raw).trim();
  return token || null;
}

export function requireSensitiveConfirmation(
  token: string | null,
  userId: string,
  action: string,
  deviceId?: string | null
): { ok: true } | { ok: false; error: string } {
  if (!token || !verifySensitiveConfirmationToken(token, userId, action, deviceId)) {
    return { ok: false, error: "Confirm it's you to continue." };
  }
  return { ok: true };
}
