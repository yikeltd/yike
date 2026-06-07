import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getListingHistoryTimeline } from "@/lib/listing-history/record";
import {
  formatHistoryEventDetail,
  listingHistoryEventLabel,
} from "@/lib/listing-history/labels";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const eventType = url.searchParams.get("type") ?? undefined;
  const publicOnly = url.searchParams.get("public") === "1";
  const filter = url.searchParams.get("filter") ?? "all";

  let typeFilter = eventType;
  if (!typeFilter && filter === "price") typeFilter = "price_changed";
  if (!typeFilter && filter === "status") typeFilter = "status_changed";
  if (!typeFilter && filter === "verification") {
    /* fetch all verification-related below */
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let events = await getListingHistoryTimeline(admin, id, {
    limit: 120,
    eventType: typeFilter,
    publicOnly,
  });

  if (filter === "verification") {
    events = await getListingHistoryTimeline(admin, id, { limit: 120 });
    events = events.filter((e) =>
      [
        "verified_physical",
        "legal_review_requested",
        "legal_review_completed",
      ].includes(e.event_type)
    );
  } else if (filter === "moderation") {
    events = await getListingHistoryTimeline(admin, id, { limit: 120 });
    events = events.filter((e) =>
      ["admin_reviewed", "report_received", "status_changed"].includes(e.event_type)
    );
  } else if (filter === "public") {
    events = events.filter((e) => e.public_visible);
  } else if (filter === "internal") {
    events = events.filter((e) => !e.public_visible);
  }

  const rows = events.map((e) => ({
    id: e.id,
    eventType: e.event_type,
    label: listingHistoryEventLabel(e.event_type),
    detail: formatHistoryEventDetail(
      e.event_type,
      e.old_value,
      e.new_value
    ),
    publicVisible: e.public_visible,
    source: e.source,
    actorRole: e.actor_role,
    internalNote: e.internal_note,
    createdAt: e.created_at,
  }));

  const { data: summary } = await admin
    .from("properties")
    .select(
      "price_change_count, last_price_changed_at, last_status_changed_at, last_verified_at, reactivation_count, had_unavailable_state, history_summary_updated_at"
    )
    .eq("id", id)
    .single();

  return NextResponse.json({ events: rows, summary: summary ?? null });
}
