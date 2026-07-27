import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { recordVerification } from "@/lib/identity/service";
import type { VerificationType } from "@/lib/identity/types";

export const runtime = "nodejs";

/**
 * POST /api/trust/verifications — Record or update verification status
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    const actorId = session?.id ?? "ops_verifier_01";
    const body = (await req.json()) as {
      userId: string;
      verificationType: VerificationType;
      status: "verified" | "pending" | "rejected";
      verifierNotes?: string;
    };

    if (!body.userId || !body.verificationType || !body.status) {
      return NextResponse.json({ error: "userId, verificationType, and status are required" }, { status: 400 });
    }

    const updatedPassport = await recordVerification(
      body.userId,
      body.verificationType,
      body.status,
      body.verifierNotes
    );

    return NextResponse.json({ passport: updatedPassport });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record verification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
