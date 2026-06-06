/**
 * NIN validation for manual admin review at launch.
 * No third-party KYC API calls — keeps onboarding cheap and friction-free.
 */

export type NinFormatResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateNinFormat(nin: string): NinFormatResult {
  const digits = nin.replace(/\D/g, "");
  if (digits.length !== 11) {
    return { ok: false, error: "NIN must be 11 digits" };
  }
  return { ok: true };
}

/** @deprecated manual review only — use validateNinFormat */
export async function verifyNin(input: {
  nin: string;
}): Promise<
  | { ok: true; provider: string }
  | { ok: false; error: string }
> {
  const result = validateNinFormat(input.nin);
  if (!result.ok) return result;
  return { ok: true, provider: "manual_review" };
}
