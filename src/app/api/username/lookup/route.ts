import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { lookupUsernameForTransfer } from "@/lib/username/lookup";
import { isUsernameLookupRateLimited } from "@/lib/yike-coins/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (isUsernameLookupRateLimited(user.id)) {
    return NextResponse.json({ error: "Too many lookups — try again shortly" }, { status: 429 });
  }

  const url = new URL(request.url);
  const username = url.searchParams.get("username") ?? url.searchParams.get("u") ?? "";
  if (!username.trim()) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const result = await lookupUsernameForTransfer(username);
  if (!result.ok) {
    const status = result.code === "not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    username: result.username,
    displayName: result.displayName,
    avatarUrl: result.avatarUrl,
  });
}
