import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAdClick } from "@/lib/advertisements/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { advertisementId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const advertisementId = String(body.advertisementId ?? "").trim();
  if (!advertisementId) {
    return NextResponse.json({ error: "advertisementId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  await recordAdClick(admin, advertisementId, user?.id ?? null, ip);
  return NextResponse.json({ ok: true });
}
