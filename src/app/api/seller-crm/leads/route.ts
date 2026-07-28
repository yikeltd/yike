import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { moveLeadStage } from "@/lib/seller-crm/service";
import type { PipelineStage } from "@/lib/seller-crm/types";

export const runtime = "nodejs";

/**
 * PATCH /api/seller-crm/leads — Move lead stage in CRM pipeline
 */
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    const sellerId = session?.id ?? "seller_01";
    const body = (await req.json()) as {
      leadId: string;
      toStage: PipelineStage;
    };

    if (!body.leadId || !body.toStage) {
      return NextResponse.json({ error: "leadId and toStage are required" }, { status: 400 });
    }

    const updatedLead = await moveLeadStage(sellerId, body.leadId, body.toStage);
    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to move lead stage";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
