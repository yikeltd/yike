import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { submitInspectionRequest } from "@/lib/conversations/service";
import type { InspectionType } from "@/lib/conversations/types";

export const runtime = "nodejs";

/**
 * POST /api/conversations/[id]/inspections — Order field inspection or legal title search
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const actorId = session?.id ?? "buyer_guest_01";
    const actorName = session?.user_metadata?.full_name ?? "Buyer";
    const body = (await req.json()) as {
      inspectionType?: InspectionType;
      preferredDate?: string;
      notes?: string;
      contactPreference?: "whatsapp" | "phone" | "email";
    };

    if (!body.inspectionType || !body.preferredDate) {
      return NextResponse.json(
        { error: "inspectionType and preferredDate are required" },
        { status: 400 }
      );
    }

    const workspace = await submitInspectionRequest(id, actorId, actorName, {
      inspectionType: body.inspectionType,
      preferredDate: body.preferredDate,
      notes: body.notes,
      contactPreference: body.contactPreference ?? "whatsapp",
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to order inspection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
