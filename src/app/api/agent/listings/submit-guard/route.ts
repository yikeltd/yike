import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailVerified } from "@/lib/auth";
import { analyzeListingSpam } from "@/lib/listing-spam-guard";

export const runtime = "nodejs";

const USER_WINDOW_MS = 60 * 60 * 1000;
const USER_MAX_PER_HOUR = 8;
const USER_COOLDOWN_MS = 2 * 60 * 1000;
const IP_WINDOW_MS = 60 * 60 * 1000;
const IP_MAX_PER_HOUR = 15;

type Body = {
  honeypot?: string;
  title?: string;
  description?: string;
};

function clientIp(hdrs: Headers): string | null {
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip")?.trim() ||
    null
  );
}

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

  const spam = analyzeListingSpam({
    title: String(body.title ?? ""),
    description: body.description,
  });
  if (spam.block) {
    return NextResponse.json({ error: spam.reason ?? "Could not submit." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role, email_verified, is_banned, account_status, phone, whatsapp")
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

  const hdrs = await headers();
  const ip = clientIp(hdrs);

  const sinceHour = new Date(Date.now() - USER_WINDOW_MS).toISOString();
  const { count: hourlyCount } = await admin
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", user.id)
    .gte("created_at", sinceHour);

  if ((hourlyCount ?? 0) >= USER_MAX_PER_HOUR) {
    return NextResponse.json(
      { error: "Too many listings. Try again later." },
      { status: 429 }
    );
  }

  const { data: lastListing } = await admin
    .from("properties")
    .select("created_at")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastListing?.created_at) {
    const elapsed = Date.now() - new Date(lastListing.created_at).getTime();
    if (elapsed < USER_COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Please wait a moment before posting another listing." },
        { status: 429 }
      );
    }
  }

  if (ip) {
    const { count: ipCount, error: ipCountError } = await admin
      .from("listing_submit_log")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", sinceHour);

    if (!ipCountError && (ipCount ?? 0) >= IP_MAX_PER_HOUR) {
      return NextResponse.json(
        { error: "Too many submissions from this connection. Try again later." },
        { status: 429 }
      );
    }
  }

  await admin.from("listing_submit_log").insert({
    user_id: user.id,
    ip,
  }).then(({ error: logError }) => {
    if (logError) console.error("[submit-guard] log insert failed:", logError.message);
  });

  return NextResponse.json({ ok: true });
}
