import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  approveSellerVerification,
  markSellerVerificationUnderReview,
  rejectSellerVerification,
  requestMoreSellerVerificationInfo,
} from "@/lib/seller-verification/service";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  let body: { action?: string; reviewNotes?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const action = body.action?.trim();
  const reviewNotes = body.reviewNotes?.trim() ?? "";

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let result;
  switch (action) {
    case "approve":
      result = await approveSellerVerification(admin, id, auth.user.id);
      break;
    case "reject":
      result = await rejectSellerVerification(admin, id, auth.user.id, reviewNotes);
      break;
    case "request_more_info":
      result = await requestMoreSellerVerificationInfo(
        admin,
        id,
        auth.user.id,
        reviewNotes
      );
      break;
    case "under_review":
      result = await markSellerVerificationUnderReview(admin, id, auth.user.id);
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, verification: result.verification });
}
