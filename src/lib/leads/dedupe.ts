import { createHash } from "crypto";
import type { VisitorContext } from "./routing-types";

const DEDUPE_WINDOW_DAYS = 7;

export function buildDedupeKey(input: {
  listingId: string;
  agentId: string;
  visitor: VisitorContext;
}): string {
  const parts = [
    input.listingId,
    input.agentId,
    input.visitor.userId ?? "",
    input.visitor.guestId ?? "",
    input.visitor.requesterWhatsapp ?? "",
    input.visitor.ipHash ?? "",
  ];
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 40);
}

export function dedupeWindowExpiresAt(): string {
  return new Date(
    Date.now() + DEDUPE_WINDOW_DAYS * 86_400_000
  ).toISOString();
}

export { DEDUPE_WINDOW_DAYS };
