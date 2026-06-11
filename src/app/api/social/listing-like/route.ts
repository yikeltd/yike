import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toggleListingLike } from "@/lib/social/listing-like";
import { getListingLikeCount, getUserLikedListingIds } from "@/lib/social/stats";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId")?.trim();
  if (!listingId) {
    return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ likeCount: 0, liked: false });
  }

  const likeCount = await getListingLikeCount(supabase, listingId);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let liked = false;
  if (user) {
    const likedSet = await getUserLikedListingIds(supabase, user.id, [listingId]);
    liked = likedSet.has(listingId);
  }

  return NextResponse.json({ likeCount, liked });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to like listings." }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const listingId = String(body.listingId ?? "").trim();

  if (!listingId) {
    return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  }

  const result = await toggleListingLike(supabase, admin, {
    userId: user.id,
    listingId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    liked: result.liked,
    likeCount: result.likeCount,
  });
}
