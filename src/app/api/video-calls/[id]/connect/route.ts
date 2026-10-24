import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markCallConnected } from "@/lib/video-calls/sessions";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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

  const result = await markCallConnected(id, user.id);
  if (!result.ok) {
    const status =
      result.code === "forbidden"
        ? 403
        : result.code === "insufficient_balance" || result.code === "price_not_configured"
          ? 402
          : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    session: result.session,
    billingStatus: result.billingStatus,
    provider: result.provider,
    providerConfigured: result.provider.configured,
  });
}
