import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveSellerPhoneAccessForBuyer } from "@/lib/seller-contact/phone-access";
import { isMarketplaceNativeContactEnabled } from "@/lib/yike-coins/flags";
import {
  resolveListingSeller,
  type MarketplaceAssetType,
} from "@/lib/marketplace-messaging/service";

export const runtime = "nodejs";

const ASSET_TYPES = new Set<MarketplaceAssetType>(["PROPERTY", "VEHICLE", "ELECTRONICS"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await context.params;
  const params = new URL(request.url).searchParams;
  const sellerId = params.get("sellerId")?.trim();
  const assetTypeRaw = params.get("assetType")?.trim().toUpperCase() ?? "";

  if (!sellerId) {
    return NextResponse.json({ error: "sellerId required" }, { status: 400 });
  }
  if (!ASSET_TYPES.has(assetTypeRaw as MarketplaceAssetType)) {
    return NextResponse.json({ error: "assetType required" }, { status: 400 });
  }
  const assetType = assetTypeRaw as MarketplaceAssetType;

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

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const listingSeller = await resolveListingSeller(admin, listingId, assetType);
  if (!listingSeller || listingSeller.sellerId !== sellerId) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const phone = await resolveSellerPhoneAccessForBuyer(admin, sellerId);

  return NextResponse.json({
    listingId,
    nativeContactEnabled: isMarketplaceNativeContactEnabled(),
    phoneReveal: phone.canRevealPhone
      ? { phone: phone.phone, telUrl: phone.telUrl }
      : { message: phone.messageForBuyer, reason: phone.reason },
  });
}
