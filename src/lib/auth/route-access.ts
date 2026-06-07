/** Routes that require an authenticated session before access. */
const PROTECTED_PREFIXES = [
  "/agent",
  "/lex",
  "/account",
  "/ambassador",
  "/verifier",
  "/legal-partner",
] as const;

/** Guest-friendly discovery routes — never force login on app open. */
const PUBLIC_PREFIXES = [
  "/browse",
  "/search",
  "/saved",
  "/properties",
  "/property-verification",
  "/verify-property",
  "/become-a-field-verifier",
  "/become-a-legal-partner",
  "/become-an-ambassador",
] as const;

export function isProtectedConsumerRoute(pathname: string): boolean {
  if (pathname === "/profile") return true;
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isPublicConsumerRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/auth")) return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
