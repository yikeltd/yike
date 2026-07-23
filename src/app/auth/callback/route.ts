import { sendWelcomeEmail } from "@/lib/email";
import { scheduleFounderWelcomeEmail } from "@/lib/email/scheduled-jobs";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { SITE_URL } from "@/lib/constants";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function resolveSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
  if (!raw) return SITE_URL;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    const host = url.hostname.toLowerCase();
    if (host === "yike.ng" || host === "www.yike.ng" || host === "localhost") {
      return `${url.protocol}//${url.host}`;
    }
  } catch {
    /* fall through */
  }
  return SITE_URL;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "/");
  const siteOrigin = resolveSiteOrigin();

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase.auth.exchangeCodeForSession(code);
      if (data.user?.email_confirmed_at) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email_verified, full_name")
          .eq("id", data.user.id)
          .maybeSingle();

        await supabase
          .from("profiles")
          .update({ email_verified: true })
          .eq("id", data.user.id);

        if (!profile?.email_verified && data.user.email) {
          const admin = tryCreateAdminClient();
          if (admin) {
            await sendWelcomeEmail(admin, {
              email: data.user.email,
              fullName: profile?.full_name ?? data.user.user_metadata?.full_name ?? "",
              userId: data.user.id,
            });
            void scheduleFounderWelcomeEmail(admin, {
              userId: data.user.id,
              email: data.user.email,
            }).catch((err) => {
              console.error("[auth/callback] schedule founder welcome failed:", err);
            });
          }
        }
      }
    }
  }

  return NextResponse.redirect(`${siteOrigin}${next}`);
}
