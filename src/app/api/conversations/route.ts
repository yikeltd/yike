import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/conversations — Initiate or get existing 1-per-listing conversation for buyer
 */
export async function POST() {
  return NextResponse.json(
    { error: "Marketplace messaging is not available." },
    { status: 410 },
  );
}
