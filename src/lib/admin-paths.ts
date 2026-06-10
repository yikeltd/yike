/** Obscured internal staff routes — never link publicly. */
export const STAFF_LOGIN_PATH = "/lex" as const;
export const ADMIN_LOGIN_PATH = STAFF_LOGIN_PATH;
export const ADMIN_BASE_PATH = "/lex/auth" as const;
export const ADMIN_OVERVIEW_PATH = "/lex/auth/overview" as const;
export const SUPPORT_BASE_PATH = "/lex/support" as const;
export const TECH_BASE_PATH = "/lex/tech" as const;

export function adminPath(segment = ""): string {
  if (!segment || segment === "overview") return ADMIN_OVERVIEW_PATH;
  return `${ADMIN_BASE_PATH}/${segment.replace(/^\//, "")}`;
}

/** Classic moderation queue — always include status so tabs match the URL. */
export function adminListingsPath(
  status = "pending",
  extra?: Record<string, string | undefined>
): string {
  const q = new URLSearchParams({ status });
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value) q.set(key, value);
  }
  return `${adminPath("listings")}?${q.toString()}`;
}

export function supportPath(segment = ""): string {
  if (!segment) return SUPPORT_BASE_PATH;
  return `${SUPPORT_BASE_PATH}/${segment.replace(/^\//, "")}`;
}

export function techPath(segment = ""): string {
  if (!segment) return TECH_BASE_PATH;
  return `${TECH_BASE_PATH}/${segment.replace(/^\//, "")}`;
}
