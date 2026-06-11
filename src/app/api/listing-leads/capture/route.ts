import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureListingLead } from "@/lib/listing-leads/capture";
import { isListingLeadType } from "@/lib/listing-leads/constants";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const leadType = String(body.leadType ?? "");
  if (!isListingLeadType(leadType)) {
    return NextResponse.json({ error: "Invalid lead type" }, { status: 400 });
  }

  const listingId = body.listingId ? String(body.listingId) : null;
  const sellerId = String(body.sellerId ?? "").trim();
  if (!sellerId) {
    return NextResponse.json({ error: "sellerId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  const result = await captureListingLead(admin, {
    listingId,
    sellerId,
    leadUserId: user?.id ?? null,
    leadType,
    sourcePage: body.sourcePage ? String(body.sourcePage) : null,
    placement: body.placement ? String(body.placement) : null,
    listingTitle: body.listingTitle ? String(body.listingTitle) : null,
    leadUserDisplay: body.leadUserDisplay ? String(body.leadUserDisplay) : null,
  });

  return NextResponse.json({ ok: result.ok, skipped: result.skipped ?? false });
}
