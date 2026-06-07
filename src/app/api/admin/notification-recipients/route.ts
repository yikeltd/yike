import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchRecipientsByIds,
  searchNotificationRecipients,
} from "@/lib/notifications/admin/search-recipients";
import type { RecipientSearchType } from "@/lib/notifications/admin/constants";

export const runtime = "nodejs";

const VALID_TYPES = new Set<RecipientSearchType>(["users", "agents", "companies"]);

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const type = String(url.searchParams.get("type") ?? "") as RecipientSearchType;
  const q = String(url.searchParams.get("q") ?? "").trim();
  const idsParam = String(url.searchParams.get("ids") ?? "").trim();

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    if (idsParam) {
      const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
      const results = await fetchRecipientsByIds(admin, type, ids);
      return NextResponse.json({ results });
    }
    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }
    const results = await searchNotificationRecipients(admin, type, q);
    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
