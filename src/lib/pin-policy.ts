export const PIN_LENGTH = 6;
export const PIN_RE = /^\d{6}$/;

export function pinChecks(pin: string) {
  const counts = new Map<string, number>();
  let maxSameDigit = 0;

  for (const digit of pin) {
    const next = (counts.get(digit) ?? 0) + 1;
    counts.set(digit, next);
    maxSameDigit = Math.max(maxSameDigit, next);
  }

  let hasThreeConsecutive = false;
  for (let i = 0; i <= pin.length - 3; i += 1) {
    const a = Number(pin[i]);
    const b = Number(pin[i + 1]);
    const c = Number(pin[i + 2]);
    if (b === a + 1 && c === b + 1) hasThreeConsecutive = true;
    if (b === a - 1 && c === b - 1) hasThreeConsecutive = true;
  }

  return {
    length: PIN_RE.test(pin),
    mixOfDigits: counts.size >= 3,
    maxTwoSame: maxSameDigit <= 2,
    noConsecutiveRun: !hasThreeConsecutive,
  };
}

export function isStrongPin(pin: string): boolean {
  const checks = pinChecks(pin);
  return (
    checks.length &&
    checks.mixOfDigits &&
    checks.maxTwoSame &&
    checks.noConsecutiveRun
  );
}

export function pinPolicyError(pin: string): string | null {
  if (!pin) return "PIN is required";
  if (!PIN_RE.test(pin)) return "PIN must be exactly 6 digits";

  const checks = pinChecks(pin);
  if (!checks.maxTwoSame) {
    return "Use at most two of the same digit in your PIN";
  }
  if (!checks.mixOfDigits) {
    return "Use a mix of digits — include at least 3 different numbers";
  }
  if (!checks.noConsecutiveRun) {
    return "Avoid three numbers in a row (like 123 or 321)";
  }

  return null;
}
