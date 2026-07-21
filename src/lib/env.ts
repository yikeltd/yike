/** True only on live production — never expose dev OTP or bypasses. */
export function isProductionEnv(): boolean {
  const appEnv = process.env.APP_ENV?.trim().toLowerCase();
  if (appEnv === "production") return true;
  if (appEnv === "development" || appEnv === "preview" || appEnv === "staging") {
    return false;
  }
  return process.env.NODE_ENV === "production";
}
