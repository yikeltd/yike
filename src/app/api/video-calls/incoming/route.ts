import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/feature-flags/index";

export const runtime = "nodejs";

export type IncomingCallRow = {
  id: string;
  call_type: "voice" | "video";
  status: "ringing" | "connected";
  caller_id: string;
  listing_id: string | null;
  created_at: string;
  connected_at: string | null;
  caller_label: string;
};

/**
 * Ringing or connected sessions where the signed-in user is the callee.
 * RLS: video_call_sessions_participant_read.
 */
export async function GET() {
  if (!isFeatureEnabled("video_call_beta") && !isFeatureEnabled("voice_call_beta")) {
    return NextResponse.json({ calls: [] as IncomingCallRow[] });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data: sessions, error } = await supabase
    .from("video_call_sessions")
    .select("id, call_type, status, caller_id, listing_id, created_at, connected_at")
    .eq("callee_id", user.id)
    .in("status", ["ringing", "connected"])
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = sessions ?? [];
  const callerIds = [...new Set(rows.map((r) => r.caller_id as string))];
  const labelByCaller = new Map<string, string>();

  if (callerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, business_name")
      .in("id", callerIds);

    for (const p of profiles ?? []) {
      const name =
        (p.business_name as string | null)?.trim() ||
        (p.full_name as string | null)?.trim() ||
        "Buyer";
      labelByCaller.set(p.id as string, name);
    }
  }

  const calls: IncomingCallRow[] = rows.map((s) => ({
    id: s.id as string,
    call_type: s.call_type as "voice" | "video",
    status: s.status as "ringing" | "connected",
    caller_id: s.caller_id as string,
    listing_id: (s.listing_id as string | null) ?? null,
    created_at: s.created_at as string,
    connected_at: (s.connected_at as string | null) ?? null,
    caller_label: labelByCaller.get(s.caller_id as string) ?? "Buyer",
  }));

  return NextResponse.json({ calls });
}
