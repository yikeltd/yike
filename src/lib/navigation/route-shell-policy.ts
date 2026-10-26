import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Route prefixes that must render inside ConsumerShell (marketplace chrome). */
export const CONSUMER_SHELL_PREFIXES = [
  "/",
  "/discover",
  "/search",
  "/saved",
  "/browse",
  "/explore",
  "/vehicles",
  "/electronics",
  "/properties",
  "/cars",
  "/agents",
  "/account",
  "/conversations",
  "/trust",
  "/agent",
  "/seller",
  "/developers",
  "/payments/history",
  "/post-property",
] as const;

/** Intentionally minimal chrome (callbacks, auth, staff). */
export const MINIMAL_CHROME_PREFIXES = [
  "/auth",
  "/lex",
  "/staff",
  "/payments/callback",
  "/payments/success",
  "/payments/failed",
  "/payments/cancelled",
  "/payments/korapay",
  "/payments/verify",
  "/offline",
] as const;

const APP_ROOT = join(process.cwd(), "src/app");

export type RouteShellExpectation = "consumer" | "minimal" | "lex" | "agent" | "unknown";

export function classifyRoutePath(pathname: string): RouteShellExpectation {
  const path = pathname.split("?")[0] ?? pathname;
  if (path.startsWith("/lex")) return "lex";
  if (path.startsWith("/agent")) return "agent";
  if (MINIMAL_CHROME_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return "minimal";
  }
  if (CONSUMER_SHELL_PREFIXES.some((p) => path === p || (p !== "/" && path.startsWith(`${p}/`)))) {
    return "consumer";
  }
  return "unknown";
}

/** Filesystem signals that a route tree mounts ConsumerShell. */
export function routeTreeHasConsumerShell(routePath: string): boolean {
  const segments = routePath.split("/").filter(Boolean);
  let dir = APP_ROOT;
  for (const segment of segments) {
    dir = join(dir, segment);
  }
  const checks = [
    join(dir, "layout.tsx"),
    join(APP_ROOT, "(public)", ...segments, "layout.tsx"),
    join(APP_ROOT, "(public)", ...segments.slice(0, 1), "layout.tsx"),
  ];
  if (segments[0] === "agent") {
    checks.push(join(APP_ROOT, "agent", "layout.tsx"));
  }
  if (
    segments[0] === "conversations" ||
    segments[0] === "trust" ||
    segments[0] === "seller"
  ) {
    checks.push(join(APP_ROOT, segments[0], "layout.tsx"));
  }
  for (const file of checks) {
    if (!existsSync(file)) continue;
    try {
      const src = readFileSync(file, "utf8");
      if (src.includes("ConsumerShell") || src.includes("ConsumerMarketplaceShell")) {
        return true;
      }
    } catch {
      /* ignore */
    }
  }
  if (existsSync(join(APP_ROOT, "(public)", "layout.tsx")) && segments.length > 0) {
    const underPublic = join(APP_ROOT, "(public)", ...segments, "page.tsx");
    if (existsSync(underPublic)) return true;
  }
  if (routePath === "/" && existsSync(join(APP_ROOT, "(public)", "page.tsx"))) {
    return true;
  }
  return false;
}
