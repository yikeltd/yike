/**
 * Ephemeral Playwright auth must never activate on production deployments,
 * even if misconfigured env vars are present.
 */
export function isProductionDeploymentRuntime(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  const vercel = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercel === "production") return true;
  return false;
}

/** Gate for E2E_EPHEMERAL_AUTH — additional to non-production Supabase ref checks. */
export function ephemeralAuthFlagAllowed(): boolean {
  if (isProductionDeploymentRuntime()) return false;
  return process.env.E2E_EPHEMERAL_AUTH === "1";
}
