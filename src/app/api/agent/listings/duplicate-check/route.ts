import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkLikelyDuplicate } from "@/lib/listing-duplicate-check";

export const runtime = "nodejs";

type Body = {
  propertyId?: string;
};

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => ({}))) as Body;
  const propertyId = String(body.propertyId ?? "").trim();
  if (!propertyId) {
    return NextResponse.json({ error: "Missing property." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: property } = await admin
    .from("properties")
    .select("id, agent_id, title, price, city, area, description, media_urls")
    .eq("id", propertyId)
    .single();

  if (!property || property.agent_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("phone, whatsapp")
    .eq("id", user.id)
    .single();

  const result = await checkLikelyDuplicate(
    admin,
    {
      agentId: user.id,
      title: property.title,
      price: Number(property.price),
      city: property.city,
      area: property.area,
      description: property.description,
      mediaUrls: property.media_urls ?? [],
      phone: profile?.phone ?? profile?.whatsapp,
    },
    propertyId
  );

  if (result.likelyDuplicate) {
    await admin
      .from("properties")
      .update({
        possible_duplicate: true,
        duplicate_confidence_score: result.confidence,
      })
      .eq("id", propertyId);
  }

  return NextResponse.json({
    ok: true,
    flagged: result.likelyDuplicate,
    confidence: result.confidence,
  });
}
