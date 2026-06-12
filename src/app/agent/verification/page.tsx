"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { VerificationWizard } from "@/components/agent/verification-wizard";
import { PhoneVerificationCard } from "@/components/profile/phone-verification-card";
import { ProfileVerificationCard } from "@/components/profile/profile-verification-card";
import Link from "next/link";
import type { AgentVerification, Profile } from "@/types/database";

export default function AgentVerificationPage() {
  const [verification, setVerification] = useState<AgentVerification | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth/login?next=/agent/verification";
      return;
    }
    const [{ data: prof }, { data: ver }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("agent_verifications")
        .select("*")
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setProfile(prof as Profile | null);
    setVerification(ver as AgentVerification | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) {
    return <p className="pt-8 text-sm text-muted">Loading…</p>;
  }

  if (!profile) {
    return <p className="pt-8 text-sm text-muted">Profile not found.</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pt-4 pb-8">
      <div>
        <Link href="/agent" className="text-xs font-semibold text-gold-dark hover:underline">
          ← Back to profile
        </Link>
        <h1 className="mt-2 text-xl font-bold text-navy">Verification</h1>
      </div>

      <div className="space-y-2">
        <PhoneVerificationCard profile={profile} onVerified={() => void reload()} />
        <ProfileVerificationCard profile={profile} />
        <VerificationWizard
          profile={profile}
          verification={verification}
          onSubmitted={() => void reload()}
        />
      </div>
    </div>
  );
}
