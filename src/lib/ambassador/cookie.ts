import { cookies } from "next/headers";
import {
  AMBASSADOR_REF_COOKIE,
  isValidAmbassadorCode,
  normalizeAmbassadorCode,
} from "./constants";

export function parseAmbassadorRefFromCookieHeader(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${AMBASSADOR_REF_COOKIE}=([^;]+)`)
  );
  if (!match?.[1]) return null;
  const code = normalizeAmbassadorCode(decodeURIComponent(match[1]));
  return isValidAmbassadorCode(code) ? code : null;
}

export async function getAmbassadorRefFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(AMBASSADOR_REF_COOKIE)?.value;
  if (!raw) return null;
  const code = normalizeAmbassadorCode(raw);
  return isValidAmbassadorCode(code) ? code : null;
}
