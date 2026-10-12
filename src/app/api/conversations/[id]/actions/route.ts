import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/conversations/[id]/actions — Execute a transaction action within the conversation
 */
export async function POST() {
  return NextResponse.json(
    { error: "Marketplace messaging is not available." },
    { status: 410 },
  );
}
