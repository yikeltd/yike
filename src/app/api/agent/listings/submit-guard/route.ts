import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailVerified } from "@/lib/auth";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

type Body = {
  honeypot?: string;
};

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => ({}))) as Body;
  if (String(body.honeypot ?? "").trim()) {
    return NextResponse.json({ error: "Submission blocked." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role, email_verified, is_banned, account_status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.is_banned) {
    return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  }

  if (!isEmailVerified(user, { email_verified: profile.email_verified })) {
    return NextResponse.json({ error: "Verify your email to list." }, { status: 400 });
  }

  if (
    profile.account_status === "on_hold" ||
    profile.account_status === "suspended" ||
    profile.account_status === "deleted"
  ) {
    return NextResponse.json({ error: "Account restricted." }, { status: 403 });
  }

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await admin
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", user.id)
    .gte("created_at", since);

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: "Too many listings. Try again later." },
      { status: 429 }
    );
  }

  return NextResponse.json({ ok: true });
}
