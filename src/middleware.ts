import { type NextRequest, NextResponse } from "next/server";
import { legacyLocationRedirect } from "@/lib/legacy-location-redirect";
import { seoHubRedirect } from "@/lib/seo/hub-redirect";
import {
  staticPathRedirect,
  trailingSlashRedirect,
} from "@/lib/route-redirects";
import { updateSession } from "@/lib/supabase/middleware";
import {
  AMBASSADOR_REF_COOKIE,
  AMBASSADOR_REF_COOKIE_MAX_AGE,
  isValidAmbassadorCode,
  normalizeAmbassadorCode,
} from "@/lib/ambassador/constants";
import { STAFF_APP_COOKIE } from "@/lib/admin/staff-app";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const slashTarget = trailingSlashRedirect(pathname);
  if (slashTarget) {
    const url = request.nextUrl.clone();
    url.pathname = slashTarget;
    return NextResponse.redirect(url, 308);
  }

  const staticTarget = staticPathRedirect(pathname);
  if (staticTarget) {
    const url = request.nextUrl.clone();
    const [path, query] = staticTarget.split("?");
    url.pathname = path ?? staticTarget;
    url.search = query ? `?${query}` : request.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }

  const hubTarget = seoHubRedirect(pathname);
  if (hubTarget) {
    const url = request.nextUrl.clone();
    const [path, query] = hubTarget.split("?");
    url.pathname = path ?? hubTarget;
    url.search = query ? `?${query}` : "";
    return NextResponse.redirect(url, 308);
  }

  const legacyTarget = legacyLocationRedirect(pathname);
  if (legacyTarget) {
    const url = request.nextUrl.clone();
    const [path, query] = legacyTarget.split("?");
    url.pathname = path ?? legacyTarget;
    url.search = query ? `?${query}` : "";
    const permanent = path?.startsWith("/houses/") ?? false;
    return NextResponse.redirect(url, permanent ? 308 : 307);
  }

  const refRaw = request.nextUrl.searchParams.get("ref");
  const response = await updateSession(request);

  if (pathname === "/staff" || pathname.startsWith("/staff/")) {
    response.cookies.set(STAFF_APP_COOKIE, "1", {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 365 * 24 * 60 * 60,
    });
  }

  if (refRaw) {
    const code = normalizeAmbassadorCode(refRaw);
    if (isValidAmbassadorCode(code)) {
      response.cookies.set(AMBASSADOR_REF_COOKIE, code, {
        maxAge: AMBASSADOR_REF_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};
