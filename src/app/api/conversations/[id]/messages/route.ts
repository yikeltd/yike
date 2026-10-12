import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/conversations/[id]/messages — Send a message in the conversation workspace
 */
export async function POST() {
  return NextResponse.json(
    { error: "Marketplace messaging is not available." },
    { status: 410 },
  );
}
