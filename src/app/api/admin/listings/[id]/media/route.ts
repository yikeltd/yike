import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mediaItemsToUrls,
  sortMediaItemsForStory,
} from "@/lib/media/items";
import type { PropertyMediaItem } from "@/types/database";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    media_items: PropertyMediaItem[];
    action?: "reorder" | "delete";
    deleted_ids?: string[];
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let items = body.media_items ?? [];
  if (body.deleted_ids?.length) {
    const drop = new Set(body.deleted_ids);
    items = items.filter((i) => !drop.has(i.id));
  }

  items = sortMediaItemsForStory(
    items.map((item, index) => ({
      ...item,
      sort_order: index,
      is_cover: index === 0,
    }))
  );

  const media_urls = mediaItemsToUrls(items);

  const { data, error } = await supabase
    .from("properties")
    .update({
      media_items: items,
      media_urls,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, media_items, media_urls")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "listing.media",
    target_type: "property",
    target_id: id,
    metadata: {
      action: body.action ?? "reorder",
      count: items.length,
      deleted: body.deleted_ids ?? [],
    },
    ip,
  });

  return NextResponse.json({ listing: data });
}
