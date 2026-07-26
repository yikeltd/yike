import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import {
  isListingDeleteReason,
  listingDeleteReasonLabel,
  type ListingDeleteReason,
} from "@/lib/admin/listing-delete";
import { hasValidPinSession } from "@/lib/admin/pin";
import { getRequestAuditContext } from "@/lib/admin/request-context";
import { recordListingHistoryEvent } from "@/lib/listing-history/record";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Permanent administrative delete (soft).
 * Sets status=archived, clears featured/boost, writes critical audit.
 * Row + media retained for recovery; public surfaces exclude non-approved.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    reason?: string;
    notes?: string;
  };

  if (!body.reason || !isListingDeleteReason(body.reason)) {
    return NextResponse.json(
      { error: "A delete reason is required" },
      { status: 400 }
    );
  }

  const reason: ListingDeleteReason = body.reason;
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : "";

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: listing } = await supabase
    .from("properties")
    .select(
      "id, title, city, agent_id, status, is_featured, is_boosted, media_urls, media_items"
    )
    .eq("id", id)
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.status === "archived") {
    return NextResponse.json(
      { error: "Listing is already deleted/archived" },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const correlationId = randomUUID();
  const reasonLabel = listingDeleteReasonLabel(reason);
  const archiveReason = notes
    ? `DELETE:${reasonLabel} — ${notes}`
    : `DELETE:${reasonLabel}`;

  const mediaUrlCount = Array.isArray(listing.media_urls)
    ? listing.media_urls.length
    : 0;
  const mediaItemCount = Array.isArray(listing.media_items)
    ? listing.media_items.length
    : 0;

  const { error: updateError } = await supabase
    .from("properties")
    .update({
      status: "archived",
      listing_activity_status: "archived",
      archived_at: now,
      archived_by: auth.user.id,
      archive_reason: archiveReason,
      is_featured: false,
      featured_until: null,
      featured_tier: null,
      featured_reason: null,
      is_boosted: false,
      boosted_until: null,
      boost_score: 0,
      updated_at: now,
      last_status_changed_at: now,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "Could not delete listing" },
      { status: 500 }
    );
  }

  // Soft-delete retention: tag media_assets for future GC; do not orphan or hard-purge
  // while the property row remains recoverable via listing.restore / archive restore.
  let mediaAssetsTagged = 0;
  const { data: mediaRows, error: mediaSelectError } = await supabase
    .from("media_assets")
    .select("id, metadata")
    .eq("listing_id", id);

  if (!mediaSelectError && mediaRows?.length) {
    const results = await Promise.all(
      mediaRows.map((row) => {
        const prev =
          row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
            ? (row.metadata as Record<string, unknown>)
            : {};
        return supabase
          .from("media_assets")
          .update({
            metadata: {
              ...prev,
              soft_deleted_at: now,
              soft_deleted_by: auth.user.id,
              soft_delete_reason: reason,
              soft_delete_correlation_id: correlationId,
              cleanup_eligible: true,
            },
          })
          .eq("id", row.id);
      })
    );
    mediaAssetsTagged = results.filter((r) => !r.error).length;
  }

  await recordListingHistoryEvent(supabase, {
    listingId: id,
    eventType: "status_changed",
    oldValue: { status: listing.status },
    newValue: { status: "archived", delete_reason: reason },
    actorId: auth.user.id,
    actorRole: auth.profile.role,
    source: "admin_delete",
    publicVisible: false,
    internalNote: archiveReason,
  });

  const ctx = await getRequestAuditContext(`/lex/auth/listings/${id}`);

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "listing.delete",
    target_type: "listing",
    target_id: id,
    target_user_id: listing.agent_id,
    reason: reasonLabel,
    metadata: {
      title: listing.title,
      listing_title: listing.title,
      city: listing.city,
      seller_id: listing.agent_id,
      delete_reason: reason,
      delete_reason_label: reasonLabel,
      notes: notes || null,
      previous_status: listing.status,
      soft_delete: true,
      correlation_id: correlationId,
      media_url_count: mediaUrlCount,
      media_item_count: mediaItemCount,
      media_assets_tagged: mediaAssetsTagged,
      media_cleanup: "tagged_for_deferred_gc",
      recovery: "restore via /api/admin/listings/[id]/archive action=restore",
    },
    ip: ctx.ip,
    user_agent_hash: ctx.user_agent_hash,
    route: ctx.route,
  });

  return NextResponse.json({
    ok: true,
    soft_delete: true,
    correlation_id: correlationId,
    status: "archived",
  });
}
