import { NextResponse } from "next/server";
import { requireSupportApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupportQuickReplies } from "@/lib/leads/support-queries";

export async function GET(req: Request) {
  const auth = await requireSupportApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const rows = await getSupportQuickReplies(admin, q);
  return NextResponse.json({ ok: true, replies: rows });
}
