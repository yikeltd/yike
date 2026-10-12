import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/conversations/[id]/inspections — Order field inspection or legal title search
 */
export async function POST() {
  return NextResponse.json(
    { error: "Marketplace messaging is not available." },
    { status: 410 },
  );
}
