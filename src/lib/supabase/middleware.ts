import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { staffConsoleRedirect } from "@/lib/admin/console-access";
import { isStaffRole } from "@/lib/admin/roles";
import { logMiddlewareFailure } from "@/lib/middleware/log-failure";
import type { UserRole } from "@/types/database";
import { isSupabaseConfigured } from "./config";

/** Preserve refreshed auth cookies when middleware returns a redirect without duplicate bloat. */
function mergeAuthResponse(from: NextResponse, to: NextResponse) {
  const seen = new Set<string>();
  from.cookies.getAll().forEach((cookie) => {
    if (!seen.has(cookie.name)) {
      seen.add(cookie.name);
      to.cookies.set(cookie);
    }
  });
  for (const key of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(key);
    if (value) to.headers.set(key, value);
  }
}

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && Boolean(cookie.value));
}

/** Sanitize request & response cookies to prevent HTTP 431 header bloat. */
function pruneStaleAuthCookies(response: NextResponse) {
  const allCookies = response.cookies.getAll();
  // Clear any empty or stale cookies to keep header payload under threshold
  for (const cookie of allCookies) {
    if (!cookie.value || cookie.value === "" || cookie.value === "deleted") {
      response.cookies.delete(cookie.name);
    }
  }
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  if (!hasSupabaseSessionCookie(request)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
            // Update request cookies first
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            // Instantiate response ONCE with updated cookies
            supabaseResponse = NextResponse.next({ request });
            // Set all refreshed cookies on response
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
            if (headers) {
              Object.entries(headers).forEach(([key, value]) => {
                supabaseResponse.headers.set(key, value);
              });
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && request.nextUrl.pathname.startsWith("/lex")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_banned")
        .eq("id", user.id)
        .maybeSingle();

      if (
        profile &&
        !profile.is_banned &&
        isStaffRole(profile.role as UserRole)
      ) {
        const target = staffConsoleRedirect(
          profile.role as UserRole,
          request.nextUrl.pathname
        );
        if (target && target !== request.nextUrl.pathname) {
          const url = request.nextUrl.clone();
          url.pathname = target;
          const redirectResponse = NextResponse.redirect(url);
          mergeAuthResponse(supabaseResponse, redirectResponse);
          pruneStaleAuthCookies(redirectResponse);
          return redirectResponse;
        }
      }
    }

    pruneStaleAuthCookies(supabaseResponse);
    return supabaseResponse;
  } catch (error) {
    logMiddlewareFailure("session", request.nextUrl.pathname, error);
    return NextResponse.next({ request });
  }
}
