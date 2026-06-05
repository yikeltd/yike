"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HumanVerifyField,
  readHumanVerifyFromForm,
} from "@/components/forms/human-verify-field";
import type { AgentVerification, Profile } from "@/types/database";
import { ShieldCheck } from "lucide-react";

export default function AgentVerificationPage() {
  const [verification, setVerification] = useState<AgentVerification | null>(
    null
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [verifyOk, setVerifyOk] = useState(false);

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const check = readHumanVerifyFromForm(form);
    if (!check.ok) {
      setMessage(check.error ?? "Please solve the math check.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (!profile?.phone_verified) {
      setMessage("Verify your phone number in account settings first.");
      setSubmitting(false);
      return;
    }

    if (!user.email_confirmed_at && !profile?.email_verified) {
      setMessage("Verify your email before submitting agent verification.");
      setSubmitting(false);
      return;
    }

    const nin = String(form.get("nin") ?? "").replace(/\D/g, "");
    if (nin.length !== 11) {
      setMessage("Enter a valid 11-digit NIN.");
      setSubmitting(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({ verification_status: "pending" })
      .eq("id", user.id);

    const { error } = await supabase.from("agent_verifications").insert({
      agent_id: user.id,
      user_id: user.id,
      nin_number_encrypted: nin,
      nin_encrypted: nin,
      selfie_url: form.get("selfie_url") as string,
      status: "pending",
      submitted_at: new Date().toISOString(),
    });

    setSubmitting(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Submitted! We will review within 1–2 business days.");
    await supabase
      .from("agent_verifications")
      .select("*")
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setVerification(data as AgentVerification));
  }

  if (loading) {
    return <p className="pt-8 text-sm text-muted">Loading…</p>;
  }

  if (verification?.status === "approved" || profile?.verification_status === "approved") {
    return (
      <div className="space-y-4 pt-4">
        <h1 className="text-xl font-bold">Verification</h1>
        <p className="text-sm text-muted">You are verified to list properties on Yike.</p>
      </div>
    );
  }

  if (verification?.status === "pending" || profile?.verification_status === "pending") {
    return (
      <div className="space-y-4 pt-4">
        <h1 className="text-xl font-bold">Verification</h1>
        <p className="text-sm text-muted">Your documents are under review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-start gap-3 rounded-2xl border border-gold/20 bg-gold/10 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark dark:text-gold" />
        <p className="text-sm leading-relaxed text-foreground">
          To list properties on Yike, verify your identity first. This helps protect property seekers.
        </p>
      </div>

      <h1 className="text-xl font-bold">Agent verification</h1>
      <p className="text-sm text-muted">
        Submit your NIN and a clear selfie. Phone and email must already be verified on your account.
      </p>

      {verification?.status === "rejected" && (
        <p className="text-sm text-danger">
          Rejected: {verification.rejection_reason ?? "Please resubmit."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="nin"
          placeholder="NIN (11 digits)"
          inputMode="numeric"
          maxLength={11}
          required
        />
        <Input name="selfie_url" placeholder="Selfie image URL" required />
        <HumanVerifyField onValidChange={setVerifyOk} />
        {message && <p className="text-sm text-primary">{message}</p>}
        <Button type="submit" fullWidth disabled={submitting || !verifyOk}>
          {submitting ? "Submitting…" : "Submit for review"}
        </Button>
      </form>
    </div>
  );
}
