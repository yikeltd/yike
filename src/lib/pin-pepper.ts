/**
 * PIN pepper — production launch blocker.
 * YIKE_PIN_PEPPER must be a long random secret (≥32 chars) in Coolify.
 */
import { isProductionEnv } from "@/lib/env";

export const PIN_PEPPER_MIN_LENGTH = 32;

export type PinPepperStatus = {
  configured: boolean;
  lengthOk: boolean;
  ok: boolean;
  source: "YIKE_PIN_PEPPER" | "SUPABASE_PIN_PEPPER" | "none";
  message: string;
};

export function getPinPepperRaw(): { value: string; source: PinPepperStatus["source"] } {
  const primary = process.env.YIKE_PIN_PEPPER?.trim() ?? "";
  if (primary) return { value: primary, source: "YIKE_PIN_PEPPER" };
  const legacy = process.env.SUPABASE_PIN_PEPPER?.trim() ?? "";
  if (legacy) return { value: legacy, source: "SUPABASE_PIN_PEPPER" };
  return { value: "", source: "none" };
}

/** Server-side pepper — never expose to client. */
export function getPinPepper(): string {
  return getPinPepperRaw().value;
}

export function getPinPepperStatus(): PinPepperStatus {
  const { value, source } = getPinPepperRaw();
  const configured = value.length > 0;
  const lengthOk = value.length >= PIN_PEPPER_MIN_LENGTH;
  const ok = configured && lengthOk;
  let message: string;
  if (!configured) {
    message = "YIKE_PIN_PEPPER missing — set a random secret ≥32 characters in Coolify";
  } else if (!lengthOk) {
    message = `YIKE_PIN_PEPPER too short (${value.length} chars) — require ≥${PIN_PEPPER_MIN_LENGTH}`;
  } else if (source === "SUPABASE_PIN_PEPPER") {
    message = "Using legacy SUPABASE_PIN_PEPPER — migrate to YIKE_PIN_PEPPER";
  } else {
    message = "PIN pepper configured";
  }
  return { configured, lengthOk, ok, source, message };
}

/**
 * Production fail-fast. Call from instrumentation / env validation.
 * Throws so the process does not silently run with weak PIN hashing.
 */
export function assertPinPepperProductionReady(): void {
  if (!isProductionEnv()) return;
  const status = getPinPepperStatus();
  if (!status.ok) {
    throw new Error(`[yike] FATAL launch blocker: ${status.message}`);
  }
}
