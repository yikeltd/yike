import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveReviewDecision } from "@/lib/review-memory/memory";
import { applyReviewTrustImpact } from "@/lib/review-memory/trust-impact";
import type { PropertyStatus } from "@/types/database";

export const runtime = "nodejs";

const BULK_ACTIONS = [
  "approve",
  "request_update",
  "lower_visibility",
  "hold",
] as const;

type BulkAction = (typeof BULK_ACTIONS)[number];

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = (await req.json()) as {
    action: BulkAction;
    listingIds: string[];
    note?: string;
  };

  if (!BULK_ACTIONS.includes(body.action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (!body.listingIds?.length || body.listingIds.length > 100) {
    return NextResponse.json({ error: "Provide 1–100 listing IDs" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const id of body.listingIds) {
    try {
      const { data: listing } = await admin
        .from("properties")
        .select("id, agent_id, status, title")
        .eq("id", id)
        .single();

      if (!listing) {
        results.push({ id, ok: false, error: "Not found" });
        continue;
      }

      const patch: Record<string, unknown> = { updated_at: now };

      if (body.action === "approve") {
        patch.status = "approved" as PropertyStatus;
        patch.last_refreshed_at = now;
        patch.listing_activity_status = "active";
        patch.review_hold_status = "none";
      } else if (body.action === "hold") {
        patch.review_hold_status = "hold";
      } else if (body.action === "lower_visibility") {
        patch.review_visibility_modifier = -15;
      } else if (body.action === "request_update") {
        patch.review_hold_status = "update_requested";
        if (listing.agent_id) {
          await admin.from("listing_review_requests").insert({
            listing_id: id,
            agent_id: listing.agent_id,
            request_type: "update",
            message:
              body.note?.trim() ??
              "Please update this listing with the missing or unclear details noted in our review.",
            status: "open",
            requested_by: auth.user.id,
            updated_at: now,
          });
        }
      }

      const { error } = await admin.from("properties").update(patch).eq("id", id);
      if (error) {
        results.push({ id, ok: false, error: error.message });
        continue;
      }

      const decisionType =
        body.action === "approve"
          ? "approved"
          : body.action === "hold"
            ? "held_for_review"
            : body.action === "lower_visibility"
              ? "lowered_visibility"
              : "requested_update";

      await saveReviewDecision(admin, {
        listing: listing as never,
        decisionType,
        decisionReason: body.note,
        adminId: auth.user.id,
        extraSignals: { bulk: true },
      });

      if (listing.agent_id) {
        await applyReviewTrustImpact(admin, {
          agentId: listing.agent_id,
          listingId: id,
          decisionType,
          adminId: auth.user.id,
        });
      }

      results.push({ id, ok: true });
    } catch (e) {
      results.push({
        id,
        ok: false,
        error: e instanceof Error ? e.message : "Failed",
      });
    }
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "listing.review_bulk",
    target_type: "property",
    target_id: body.listingIds[0],
    metadata: {
      action: body.action,
      count: body.listingIds.length,
      succeeded: results.filter((r) => r.ok).length,
    },
    ip,
  });

  return NextResponse.json({
    results,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  });
}
