import { headers } from "next/headers";
import { createHash } from "crypto";

export function hashUserAgent(ua: string): string {
  return createHash("sha256").update(ua).digest("hex").slice(0, 16);
}

export async function getRequestAuditContext(route?: string) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const userAgent = hdrs.get("user-agent") ?? undefined;
  const referer = hdrs.get("referer") ?? undefined;

  return {
    ip,
    user_agent_hash: userAgent ? hashUserAgent(userAgent) : undefined,
    route: route ?? referer ?? undefined,
  };
}
