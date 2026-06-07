import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSupportApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const auth = await requireSupportApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const profileId = new URL(req.url).searchParams.get("profile_id");
  if (!profileId) {
    return NextResponse.json({ error: "profile_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data } = await admin
    .from("internal_profile_notes")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ ok: true, notes: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireSupportApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as { profile_id: string; note: string };
  if (!body.profile_id?.trim() || !body.note?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("internal_profile_notes")
    .insert({
      profile_id: body.profile_id,
      note: body.note.trim(),
      created_by: auth.user.id,
      visibility: "internal_only",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "agent.note",
    target_type: "profile",
    target_id: body.profile_id,
    metadata: { note_id: data.id },
    ip,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
