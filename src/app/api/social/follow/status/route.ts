import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isFollowingUser } from "@/lib/social/stats";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim();

  if (!userId) {
    return NextResponse.json({ error: "Missing user." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ following: false });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id === userId) {
    return NextResponse.json({ following: false });
  }

  const following = await isFollowingUser(supabase, user.id, userId);
  return NextResponse.json({ following });
}
