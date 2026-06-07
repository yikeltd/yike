export function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Email or password doesn't match. Try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Check your email for a confirmation link.";
  }
  if (lower.includes("user already registered")) {
    return "This email already has an account. Sign in instead.";
  }
  if (lower.includes("rate limit")) {
    return "Too many tries. Wait a moment and try again.";
  }
  return "Couldn't sign in. Try again.";
}
