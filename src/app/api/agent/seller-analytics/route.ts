import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSellerAnalyticsSummary } from "@/lib/subscriptions/analytics";
import { canListProperties } from "@/lib/agent-tiers";
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

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!canListProperties(profile as Profile)) {
    return NextResponse.json({ error: "Lister account required" }, { status: 403 });
  }

  const analytics = await getSellerAnalyticsSummary(admin, user.id);
  return NextResponse.json({ analytics });
}
