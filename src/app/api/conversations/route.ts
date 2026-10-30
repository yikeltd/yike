import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateMarketplaceConversation,
  isMarketplaceMessagingEnabled,
  listConversationsForUser,
  type MarketplaceAssetType,
} from "@/lib/marketplace-messaging/service";

export const runtime = "nodejs";

export async function GET() {
  if (!isMarketplaceMessagingEnabled()) {
    return NextResponse.json({ error: "Messaging is not available" }, { status: 503 });
  }

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

  const conversations = await listConversationsForUser(user.id);
  return NextResponse.json({ conversations });
}

/**
 * POST /api/conversations — start or resume 1-per-listing buyer conversation
 */
export async function POST(request: Request) {
  if (!isMarketplaceMessagingEnabled()) {
    return NextResponse.json({ error: "Messaging is not available" }, { status: 503 });
  }

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

  let body: { listingId?: string; assetType?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const listingId = body.listingId?.trim();
  const assetType = body.assetType?.trim().toUpperCase() as MarketplaceAssetType;
  if (!listingId || !["PROPERTY", "VEHICLE", "ELECTRONICS"].includes(assetType)) {
    return NextResponse.json({ error: "Listing and asset type required" }, { status: 400 });
  }

  const result = await getOrCreateMarketplaceConversation({
    listingId,
    assetType,
    buyerId: user.id,
  });

  if (!result.ok) {
    const status =
      result.code === "schema_unavailable" || result.code === "disabled"
        ? 503
        : result.code === "not_found"
          ? 404
          : result.code === "forbidden" || result.code === "self"
            ? 403
            : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    conversation: result.conversation,
    created: result.created,
  });
}
