import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMarketplaceConversationForUser,
  isMarketplaceMessagingEnabled,
} from "@/lib/marketplace-messaging/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { listingPath } from "@/lib/marketplace/listing-path";

export const runtime = "nodejs";

/** GET /api/conversations/[id] — Marketplace thread metadata for participants. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isMarketplaceMessagingEnabled()) {
    return NextResponse.json({ error: "Messaging is not available" }, { status: 503 });
  }

  const { id } = await context.params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const result = await getMarketplaceConversationForUser(id, user.id);
  if (!result.ok) {
    const status =
      result.code === "forbidden" ? 403 : result.code === "not_found" ? 404 : 503;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  const conv = result.conversation;
  const peerId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;

  let listingHref: string | null = null;
  let listingTitle: string | null = null;
  const admin = createAdminClient();
  if (admin) {
    const { data: listing } = await admin
      .from("properties")
      .select("id, slug, title, asset_type")
      .eq("id", conv.listing_id)
      .maybeSingle();
    if (listing) {
      listingTitle = listing.title as string;
      listingHref = listingPath({
        id: listing.id as string,
        slug: listing.slug as string | null,
        asset_type: listing.asset_type as string,
      });
    }
  }

  return NextResponse.json({
    conversation: conv,
    peerId,
    role: conv.buyer_id === user.id ? "buyer" : "seller",
    listingHref,
    listingTitle,
  });
}
