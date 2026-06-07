import { PARTNER_CODE_PREFIX, LEGAL_REQUEST_PREFIX } from "./constants";

function randomSegment(length = 5, chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generatePartnerCode(): string {
  return `${PARTNER_CODE_PREFIX}-${randomSegment(5)}`;
}

export function formatYlrReference(digits: string): string {
  return `${LEGAL_REQUEST_PREFIX}-${digits}`;
}
