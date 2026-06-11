import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toggleProfileFollow } from "@/lib/social/follow";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to follow sellers." }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const followedUserId = String(body.userId ?? body.followedUserId ?? "").trim();

  if (!followedUserId) {
    return NextResponse.json({ error: "Missing user." }, { status: 400 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, username, is_banned, profile_status")
    .eq("id", followedUserId)
    .maybeSingle();

  if (!profile || profile.is_banned || profile.profile_status === "deleted") {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const { data: followerProfile } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", user.id)
    .maybeSingle();

  const followerName =
    followerProfile?.full_name?.trim() ||
    followerProfile?.username?.trim() ||
    "A Yike user";

  const result = await toggleProfileFollow(supabase, admin, {
    followerId: user.id,
    followedId: followedUserId,
    followerName,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, following: result.following });
}
