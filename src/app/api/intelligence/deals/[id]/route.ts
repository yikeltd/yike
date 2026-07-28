import { NextResponse } from "next/server";
import { analyzeDealHealth } from "@/lib/intelligence/service";

export const runtime = "nodejs";

/**
 * GET /api/intelligence/deals/[id] — Deal Health & Closing Probability Analysis
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const analysis = await analyzeDealHealth(id);
    return NextResponse.json({ ok: true, dealId: id, analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deal analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
