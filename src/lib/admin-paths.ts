/** Obscured admin console — never link publicly. */
export const ADMIN_LOGIN_PATH = "/lex/auth" as const;
export const ADMIN_OVERVIEW_PATH = "/lex/auth/overview" as const;
export const ADMIN_BASE_PATH = "/lex/auth" as const;

export function adminPath(segment = ""): string {
  if (!segment || segment === "overview") return ADMIN_OVERVIEW_PATH;
  return `${ADMIN_BASE_PATH}/${segment.replace(/^\//, "")}`;
}
