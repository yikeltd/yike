import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createCase, listCases } from "@/lib/cases/service";
import type { AssignedTeam, CasePriority, CaseStatus, CaseType } from "@/lib/cases/types";

export const runtime = "nodejs";

/**
 * GET /api/cases — List cases with operational filters
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const team = (searchParams.get("team") as AssignedTeam) || undefined;
    const officerId = searchParams.get("officerId") || undefined;
    const status = (searchParams.get("status") as CaseStatus) || undefined;
    const caseType = (searchParams.get("caseType") as CaseType) || undefined;
    const conversationId = searchParams.get("conversationId") || undefined;

    const cases = await listCases({ team, officerId, status, caseType, conversationId });
    return NextResponse.json({ cases });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch cases";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/cases — Create a new managed operational Case
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    const actorId = session?.id ?? "buyer_guest_01";
    const body = (await req.json()) as {
      caseType: CaseType;
      conversationId?: string;
      listingId?: string;
      buyerId?: string;
      sellerId?: string;
      title: string;
      description?: string;
      priority?: CasePriority;
      autoAssign?: boolean;
    };

    if (!body.caseType || !body.title) {
      return NextResponse.json({ error: "caseType and title are required" }, { status: 400 });
    }

    const newCase = await createCase({
      ...body,
      buyerId: body.buyerId ?? actorId,
    });

    return NextResponse.json({ case: newCase });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
