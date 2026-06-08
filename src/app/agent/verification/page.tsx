"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { VerificationWizard } from "@/components/agent/verification-wizard";
import { BankVerificationCard } from "@/components/verification/bank-verification-card";
import { VerificationTrustGate } from "@/components/verification/verification-trust-gate";
import { getRequiredVerificationTasks } from "@/lib/verification/tasks";
import { getTrustCapabilities } from "@/lib/verification/permissions";
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

  const trustCaps = getTrustCapabilities(profile);
  const tasks = getRequiredVerificationTasks(profile);

  return (
    <div className="mx-auto max-w-lg space-y-4 pt-4 pb-8">
      {trustCaps.verificationRequired ? (
        <VerificationTrustGate tasks={tasks} hideActions />
      ) : null}
      <BankVerificationCard
        bankName={profile.bank_name}
        resolvedName={profile.bank_account_resolved_name}
        verified={profile.bank_verified}
      />
      <h1 className="text-xl font-bold text-navy">Verified agent application</h1>
      <p className="text-sm text-muted">
        Optional — get the trust badge, higher search ranking, and unlimited listings.
        You can already list as an unverified agent. Phone and email must be confirmed.
      </p>
      <VerificationWizard
        profile={profile}
        verification={verification}
        onSubmitted={() => void reload()}
      />
    </div>
  );
}
