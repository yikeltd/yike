import { VERIFIER_CODE_PREFIX } from "./constants";

function randomSegment(length = 5): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generateVerifierCode(): string {
  return `${VERIFIER_CODE_PREFIX}-${randomSegment(5)}`;
}
