import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requestViewing } from "@/lib/conversations/service";

export const runtime = "nodejs";

/**
 * POST /api/conversations/[id]/viewings — Request or schedule a viewing
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
      date?: string;
      time?: string;
      meetingPoint?: string;
      notes?: string;
    };

    if (!body.date || !body.time || !body.meetingPoint) {
      return NextResponse.json(
        { error: "date, time, and meetingPoint are required" },
        { status: 400 }
      );
    }

    const viewing = await requestViewing(
      id,
      actorId,
      actorName,
      body.date,
      body.time,
      body.meetingPoint,
      body.notes
    );

    return NextResponse.json({ viewing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to schedule viewing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
