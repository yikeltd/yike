import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SALT_BYTES = 16;
const KEY_LEN = 64;
const SCRYPT_COST = 16384; // N=2^14 — comparable strength to bcrypt cost ~12

/** Server-side pepper — never expose to client. */
export function getPinPepper(): string {
  return (
    process.env.YIKE_PIN_PEPPER?.trim() ||
    process.env.SUPABASE_PIN_PEPPER?.trim() ||
    ""
  );
}

function pepperedPin(pin: string, usePepper: boolean): string {
  const pepper = getPinPepper();
  if (!usePepper || !pepper) return pin;
  return `${pin}:${pepper}`;
}

export function hashPin(pin: string): string {
  if (!/^\d{6}$/.test(pin)) {
    throw new Error("PIN must be exactly 6 digits");
  }
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(pepperedPin(pin, true), salt, KEY_LEN, {
    N: SCRYPT_COST,
  });
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");

  for (const usePepper of [true, false]) {
    try {
      const actual = scryptSync(pepperedPin(pin, usePepper), salt, expected.length, {
        N: SCRYPT_COST,
      });
      if (timingSafeEqual(actual, expected)) return true;
    } catch {
      /* try legacy (no explicit cost) */
      try {
        const actual = scryptSync(pepperedPin(pin, usePepper), salt, expected.length);
        if (timingSafeEqual(actual, expected)) return true;
      } catch {
        /* continue */
      }
    }
  }

  return false;
}
