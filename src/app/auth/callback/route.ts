import { sendWelcomeEmail } from "@/lib/email";
import { scheduleFounderWelcomeEmail } from "@/lib/email/scheduled-jobs";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

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
          const admin = createAdminClient();
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

  return NextResponse.redirect(`${origin}${next}`);
}
