import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, getProfile } from "@/lib/auth";
import { analyzeListingPrice } from "@/lib/pricing/analyze";
import { lookupMarketMemory } from "@/lib/pricing/recalculate";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const price = Number(body.price);
  if (!price || price <= 0) {
    return NextResponse.json({ error: "Valid price required" }, { status: 400 });
  }

  const user = await getSession();
  const profile = user ? await getProfile(user.id) : null;
  const agentVerified = profile ? isVerifiedAgentProfile(profile) : false;

  const input = {
    state: String(body.state ?? "Lagos"),
    city: String(body.city ?? ""),
    lga: body.lga ? String(body.lga) : null,
    area: String(body.area ?? body.city ?? ""),
    neighborhood: body.neighborhood ? String(body.neighborhood) : null,
    property_type: String(body.property_type ?? "apartment"),
    listing_type: String(body.listing_type ?? "rent"),
    price,
    bedrooms: Number(body.bedrooms ?? 0) || undefined,
    agentVerified,
    companyVerified: profile?.verification_status === "approved",
    yikeVerified: false,
  };

  const { memory, luxuryMultiplier } = await lookupMarketMemory(admin, input);
  const analysis = analyzeListingPrice(input, memory, luxuryMultiplier);

  return NextResponse.json({ ok: true, analysis });
}
