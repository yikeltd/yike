import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileSocialStats } from "@/lib/social/stats";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing user." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ followersCount: 0, listingLikesCount: 0 });
  }

  const stats = await getProfileSocialStats(supabase, userId);
  return NextResponse.json(stats);
}
