import { PIN_RE, pinPolicyError } from "@/lib/pin-policy";

export const PASSWORD_MIN_LENGTH = 8;
/** Auth secret minimum when the credential is a 6-digit login PIN. */
export const AUTH_SECRET_MIN_LENGTH = 6;

export const PASSWORD_RULES = {
  minLength: PASSWORD_MIN_LENGTH,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
} as const;

export function passwordChecks(password: string) {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    uppercase: PASSWORD_RULES.uppercase.test(password),
    lowercase: PASSWORD_RULES.lowercase.test(password),
    number: PASSWORD_RULES.number.test(password),
  };
}

export function isStrongPassword(password: string): boolean {
  const c = passwordChecks(password);
  return c.minLength && c.uppercase && c.lowercase && c.number;
}

export function passwordPolicyError(password: string): string | null {
  if (!password) return "Password is required";
  const c = passwordChecks(password);
  if (!c.minLength) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  if (!c.uppercase) return "Password must include an uppercase letter";
  if (!c.lowercase) return "Password must include a lowercase letter";
  if (!c.number) return "Password must include a number";
  return null;
}

/** Signup accepts a 6-digit PIN (as Auth password) or a strong legacy password. */
export function signupCredentialError(password: string): string | null {
  if (!password) return "PIN is required";
  if (PIN_RE.test(password) || /^\d+$/.test(password)) {
    return pinPolicyError(password);
  }
  return passwordPolicyError(password);
}

export function isValidSignupCredential(password: string): boolean {
  return signupCredentialError(password) === null;
}
