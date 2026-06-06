export const PASSWORD_MIN_LENGTH = 8;

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
