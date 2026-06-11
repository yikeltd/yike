import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFollowProfiles } from "@/lib/social/stats";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  const profiles = await getFollowProfiles(supabase, user.id, "following", limit, offset);
  return NextResponse.json({ profiles });
}
