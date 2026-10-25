import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setProfileUsername } from "@/lib/username/profile-username";
import { normalizeUsername } from "@/lib/username/rules";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, username_updated_at")
    .eq("id", user.id)
    .maybeSingle();

  const username = profile?.username ? normalizeUsername(profile.username) : null;

  return NextResponse.json({
    username,
    needsUsername: !username,
    usernameUpdatedAt: profile?.username_updated_at ?? null,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let body: { username?: string; change?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await setProfileUsername(user.id, String(body.username ?? ""), {
    allowReplace: Boolean(body.change),
  });

  if (!result.ok) {
    const status =
      result.code === "username_taken"
        ? 409
        : result.code === "rate_limited"
          ? 429
          : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    username: result.username,
    alreadySet: result.alreadySet,
  });
}
