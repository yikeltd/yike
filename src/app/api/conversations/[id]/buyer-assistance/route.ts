import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/conversations/[id]/buyer-assistance — Engage Buyer Assistance concierge
 */
export async function POST() {
  return NextResponse.json(
    { error: "Marketplace messaging is not available." },
    { status: 410 },
  );
}
