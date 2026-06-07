import { createHmac, timingSafeEqual } from "crypto";

const TTL_MS = 5 * 60 * 1000;

function signingSecret(): string | null {
  const secret =
    process.env.CRON_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    null;
  return secret;
}

export function createSensitiveConfirmationToken(
  userId: string,
  action: string
): string | null {
  const secret = signingSecret();
  if (!secret) return null;

  const exp = Date.now() + TTL_MS;
  const payload = `${userId}:${action}:${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifySensitiveConfirmationToken(
  token: string,
  userId: string,
  action: string
): boolean {
  const secret = signingSecret();
  if (!secret || !token) return false;

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon <= 0) return false;

    const sig = decoded.slice(lastColon + 1);
    const payload = decoded.slice(0, lastColon);
    const parts = payload.split(":");
    if (parts.length !== 3) return false;

    const [uid, act, expStr] = parts;
    if (uid !== userId || act !== action) return false;

    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;

    const expected = createHmac("sha256", secret).update(payload).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) return false;

    return timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}
