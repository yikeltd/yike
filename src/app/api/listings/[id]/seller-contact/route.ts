import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveSellerPhoneAccessForBuyer } from "@/lib/seller-contact/phone-access";
import { isMarketplaceNativeContactEnabled } from "@/lib/yike-coins/flags";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await context.params;
  const sellerId = new URL(request.url).searchParams.get("sellerId")?.trim();

  if (!sellerId) {
    return NextResponse.json({ error: "sellerId required" }, { status: 400 });
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

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
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
