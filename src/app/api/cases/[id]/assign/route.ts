import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assignCase } from "@/lib/cases/service";
import type { AssignedTeam } from "@/lib/cases/types";

export const runtime = "nodejs";

/**
 * POST /api/cases/[id]/assign — Reassign case officer or team
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const actorId = session?.id ?? "ops_manager_01";
    const body = (await req.json()) as {
      assignedTeam: AssignedTeam;
      officerId?: string;
      officerName?: string;
    };

    if (!body.assignedTeam) {
      return NextResponse.json({ error: "assignedTeam is required" }, { status: 400 });
    }

    const updatedCase = await assignCase(
      id,
      body.assignedTeam,
      body.officerId,
      body.officerName,
      actorId
    );

    return NextResponse.json({ case: updatedCase });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
