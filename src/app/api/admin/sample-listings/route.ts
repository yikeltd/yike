import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { hasValidPinSession } from "@/lib/admin/pin";
import { getRequestAuditContext } from "@/lib/admin/request-context";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const SEED_NAMESPACE = "yike-demo-marketplace-v1";

/**
 * Admin: remove sample / demo marketplace listings.
 * POST { mode: "one" | "bulk", listingId?: string }
 * Only deletes rows tagged attributes.is_sample / is_demo + seed namespace.
 */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    mode?: "one" | "bulk";
    listingId?: string;
  };
  const mode = body.mode === "one" ? "one" : "bulk";

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let query = supabase
    .from("properties")
    .select("id, title, attributes")
    .or(
      `attributes.cs.{"is_sample":true},attributes.cs.{"is_demo":true},attributes.cs.{"seed_namespace":"${SEED_NAMESPACE}"}`,
    );

  if (mode === "one") {
    const id = String(body.listingId ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }
    query = query.eq("id", id);
  }

  const { data: rows, error: selectError } = await query.limit(mode === "one" ? 1 : 500);
  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  const ids = (rows ?? [])
    .filter((r) => {
      const attrs = (r.attributes ?? {}) as Record<string, unknown>;
      return (
        attrs.is_sample === true ||
        attrs.is_demo === true ||
        attrs.seed_namespace === SEED_NAMESPACE
      );
    })
    .map((r) => r.id as string);

  if (ids.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const { error: deleteError } = await supabase
    .from("properties")
    .delete()
    .in("id", ids);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const ctx = await getRequestAuditContext("/lex/auth/listings");
  writeAuditLogAsync({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "sample_listings_purged",
    target_type: "properties",
    target_id: mode === "one" ? ids[0] : undefined,
    metadata: { mode, deleted: ids.length, ids: ids.slice(0, 50) },
    ...ctx,
  });

  return NextResponse.json({ ok: true, deleted: ids.length, ids });
}
