/**
 * Yike BTOS — Cryptographic Signatures & Payment Idempotency Engine (Milestone 6)
 * HMAC-SHA512 webhook verification & idempotency guards against duplicate transactions.
 */

import crypto from "node:crypto";

export class WebhookSecurityManager {
  /**
   * Verifies Paystack HMAC-SHA512 signature header
   */
  public static verifyPaystackSignature(
    rawBody: string,
    signatureHeader: string | null,
    secretKey: string
  ): boolean {
    if (!signatureHeader || !secretKey) return false;
    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");
    return hash === signatureHeader;
  }
}

export class IdempotencyGuard {
  private static processedKeys: Set<string> = new Set();

  public static isDuplicate(idempotencyKey: string): boolean {
    return this.processedKeys.has(idempotencyKey);
  }

  public static recordKey(idempotencyKey: string): void {
    this.processedKeys.add(idempotencyKey);
  }
}
