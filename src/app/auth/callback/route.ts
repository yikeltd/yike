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
        await supabase
          .from("profiles")
          .update({ email_verified: true })
          .eq("id", data.user.id);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
