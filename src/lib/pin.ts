import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { pinPolicyError } from "@/lib/pin-policy";
import { getPinPepper } from "@/lib/pin-pepper";

export {
  assertPinPepperProductionReady,
  getPinPepper,
  getPinPepperRaw,
  getPinPepperStatus,
  PIN_PEPPER_MIN_LENGTH,
} from "@/lib/pin-pepper";
export type { PinPepperStatus } from "@/lib/pin-pepper";

const SALT_BYTES = 16;
const KEY_LEN = 64;
const SCRYPT_COST = 16384; // N=2^14 — comparable strength to bcrypt cost ~12

function pepperedPin(pin: string, usePepper: boolean): string {
  const pepper = getPinPepper();
  if (!usePepper || !pepper) return pin;
  return `${pin}:${pepper}`;
}

export function hashPin(pin: string): string {
  const policyError = pinPolicyError(pin);
  if (policyError) {
    throw new Error(policyError);
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
