import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/conversations/[id] — Fetch detailed conversation workspace
 */
export async function GET() {
  return NextResponse.json(
    { error: "Marketplace messaging is not available." },
    { status: 410 },
  );
}
