import { randomBytes } from "crypto";

/** Unique payment reference — never accept client-supplied references. */
export function generatePaymentReference(prefix = "YK"): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(5).toString("hex").toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}
