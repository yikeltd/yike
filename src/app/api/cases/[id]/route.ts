import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { addCaseNote, getCaseById, updateCaseStatus } from "@/lib/cases/service";
import type { CaseStatus } from "@/lib/cases/types";

export const runtime = "nodejs";

/**
 * GET /api/cases/[id] — Fetch detailed case record
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const c = await getCaseById(id);
    if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    return NextResponse.json({ case: c });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/cases/[id] — Update case status or add note
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const actorId = session?.id ?? "ops_officer_01";
    const actorName = session?.user_metadata?.full_name ?? "Operations Officer";
    const body = (await req.json()) as {
      status?: CaseStatus;
      customerNote?: string;
      internalNote?: string;
    };

    let updatedCase = await getCaseById(id);
    if (!updatedCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    if (body.status) {
      updatedCase = await updateCaseStatus(id, body.status, actorId, actorName, body.customerNote);
    }

    if (body.internalNote) {
      await addCaseNote(id, actorId, actorName, body.internalNote, true);
      updatedCase = await getCaseById(id);
    }

    if (body.customerNote && !body.status) {
      await addCaseNote(id, actorId, actorName, body.customerNote, false);
      updatedCase = await getCaseById(id);
    }

    return NextResponse.json({ case: updatedCase });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
