import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLatestSellerVerification, syncSellerVerificationLevel } from "@/lib/seller-verification/service";
import { getSellerTrustLevel } from "@/lib/seller-verification/levels";
import type { Profile } from "@/types/database";

export const runtime = "nodejs";

export async function GET() {
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

  await syncSellerVerificationLevel(admin, user.id);

  const { data: profileRow } = await admin
    .from("profiles")
    .select(
      "id, seller_verification_level, email_verified, whatsapp, phone, whatsapp_verified_at, whatsapp_verification_status, account_type, company_name, cac_number, full_name, date_of_birth, residential_address, office_address, residential_city, residential_state"
    )
    .eq("id", user.id)
    .single();

  const profile = profileRow as Profile | null;
  const verification = await getLatestSellerVerification(admin, user.id);

  return NextResponse.json({
    trustLevel: getSellerTrustLevel(profile),
    verification,
  });
}
