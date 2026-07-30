import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { submitUserReport } from "@/lib/trust-safety/service";
import { ReportCategory } from "@/types/trust-safety";

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const supabase = await requireServerClient();
    const body = await request.json();

    const {
      reportedUserId,
      reportedListingId,
      reportedConversationId,
      category,
      description,
      evidence,
    } = body;

    if (!reportedUserId || !category || !description) {
      return NextResponse.json(
        { error: "Missing required report parameters (reportedUserId, category, description)" },
        { status: 400 }
      );
    }

    const report = await submitUserReport(supabase, {
      reporterId: user.id,
      reportedUserId,
      reportedListingId,
      reportedConversationId,
      category: category as ReportCategory,
      description: String(description).slice(0, 2000),
      evidence: Array.isArray(evidence) ? evidence : [],
    });

    return NextResponse.json({
      success: true,
      message: "Report received. Our Trust & Safety team will review the evidence.",
      reportId: report.id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit report";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
