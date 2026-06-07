import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { staffConsoleRedirect } from "@/lib/admin/console-access";
import { isStaffRole } from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";
import { isSupabaseConfigured } from "./config";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
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
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
