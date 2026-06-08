import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVerificationControlConfig } from "@/lib/verification/config";
import { getTrustCapabilities } from "@/lib/verification/permissions";
import { getRequiredVerificationTasks } from "@/lib/verification/tasks";
import { deriveVerificationState, VERIFICATION_STATE_LABELS } from "@/lib/verification/status-states";
import type { TrustProfileSlice } from "@/lib/verification/levels";

export const runtime = "nodejs";

export async function GET() {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const config = await getVerificationControlConfig(supabase);
  const slice = profile as TrustProfileSlice;
  const caps = getTrustCapabilities(slice, config);
  const tasks = getRequiredVerificationTasks(slice, config);
  const state = deriveVerificationState(slice);

  return NextResponse.json({
    level: caps.level,
    verificationState: state,
    verificationStateLabel: VERIFICATION_STATE_LABELS[state],
    verificationRequired: caps.verificationRequired,
    calmMessage: caps.calmMessage,
    capabilities: {
      canList: caps.canList,
      canEditListings: caps.canEditListings,
      canReceiveLeads: caps.canReceiveLeads,
      canShowWhatsApp: caps.canShowWhatsApp,
    },
    tasks,
  });
}
