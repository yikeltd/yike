import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { fetchAuditLogs } from "@/lib/admin/audit-query";
import type { AuditRiskLevel } from "@/lib/admin/audit-risk";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "50");

  const { logs, total } = await fetchAuditLogs(supabase, {
    q: url.searchParams.get("q") ?? undefined,
    action: url.searchParams.get("action") ?? undefined,
    actorId: url.searchParams.get("actorId") ?? undefined,
    targetUserId: url.searchParams.get("targetUserId") ?? undefined,
    targetId: url.searchParams.get("targetId") ?? undefined,
    riskLevel: (url.searchParams.get("riskLevel") as AuditRiskLevel) || undefined,
    from: url.searchParams.get("from")
      ? new Date(url.searchParams.get("from")!).toISOString()
      : undefined,
    to: url.searchParams.get("to")
      ? new Date(`${url.searchParams.get("to")}T23:59:59`).toISOString()
      : undefined,
    page,
    pageSize,
  });

  return NextResponse.json({ logs, total, page });
}
