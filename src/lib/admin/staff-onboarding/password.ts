import { randomBytes } from "crypto";

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const DIGITS = "23456789";
const ALL = UPPER + LOWER + DIGITS;

/** Generate a readable temporary password (no ambiguous chars). */
export function generateTemporaryPassword(length = 14): string {
  const chars: string[] = [
    UPPER[randomBytes(1)[0] % UPPER.length],
    LOWER[randomBytes(1)[0] % LOWER.length],
    DIGITS[randomBytes(1)[0] % DIGITS.length],
  ];
  while (chars.length < length) {
    chars.push(ALL[randomBytes(1)[0] % ALL.length]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
