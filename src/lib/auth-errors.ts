export function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Email or password doesn't match. Try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Verify your email with the 6-digit code we sent you.";
  }
  if (lower.includes("user already registered") || lower.includes("already registered")) {
    return "An account already exists with this email. Please sign in.";
  }
  if (lower.includes("rate limit")) {
    return "Too many tries. Wait a moment and try again.";
  }
  return "Couldn't sign in. Try again.";
}

export function friendlySignupError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already") && lower.includes("email")) {
    return "An account already exists with this email. Please sign in.";
  }
  if (lower.includes("username")) {
    return "That username is taken. Try another.";
  }
  return message.length > 120 ? "Could not create account. Please try again." : message;
}
