import { createHash, randomBytes } from "crypto";

export function createFollowUpToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  const hash = hashFollowUpToken(raw);
  return { raw, hash };
}

export function hashFollowUpToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
