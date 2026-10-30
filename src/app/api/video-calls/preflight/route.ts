import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVideoCallPreflight } from "@/lib/video-calls/allowance";
import { isFeatureEnabled } from "@/lib/feature-flags/index";

export const runtime = "nodejs";

export async function GET() {
  if (!isFeatureEnabled("video_call_beta")) {
    return NextResponse.json({ error: "Video calls are not available" }, { status: 503 });
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

  const preflight = await getVideoCallPreflight(user.id);
  return NextResponse.json(preflight);
}
