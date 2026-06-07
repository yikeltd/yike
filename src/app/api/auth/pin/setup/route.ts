import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/session-state";
import { hashPin } from "@/lib/pin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin ?? "");
  const password = String(body.password ?? "");

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 6 digits." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  if (password.length >= 8) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (authError) {
      return NextResponse.json({ error: "Password incorrect." }, { status: 401 });
    }
  }

  const pinHash = hashPin(pin);
  const { error } = await supabase
    .from("profiles")
    .update({ pin_hash: pinHash, has_pin_set: true })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: "Could not save PIN. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
