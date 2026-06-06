import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGO = "aes-256-gcm";
const SALT = "yike-sensitive-v1";

function getKey(): Buffer | null {
  const secret = process.env.ENCRYPTION_SECRET?.trim();
  if (!secret) return null;
  return scryptSync(secret, SALT, 32);
}

/** Encrypt NIN and other sensitive fields — server-side only. */
export function encryptSensitive(plaintext: string): string | null {
  const key = getKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

export function decryptSensitive(payload: string): string | null {
  const key = getKey();
  if (!key || !payload.startsWith("v1:")) return null;
  const [, ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) return null;
  try {
    const decipher = createDecipheriv(
      ALGO,
      key,
      Buffer.from(ivB64, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}
