import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/conversations/[id]/offers — Submit or respond to an offer
 */
export async function POST() {
  return NextResponse.json(
    { error: "Marketplace messaging is not available." },
    { status: 410 },
  );
}
