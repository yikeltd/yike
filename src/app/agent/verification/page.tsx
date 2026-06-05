"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import type { AgentVerification } from "@/types/database";

export default function AgentVerificationPage() {
  const [verification, setVerification] = useState<AgentVerification | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

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
      const { data } = await supabase
        .from("agent_verifications")
        .select("*")
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setVerification(data as AgentVerification | null);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      verification_status: "pending",
    }).eq("id", user.id);

    const { error } = await supabase.from("agent_verifications").insert({
      agent_id: user.id,
      selfie_url: form.get("selfie_url") as string,
      id_document_url: form.get("id_document_url") as string,
      status: "pending",
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

  if (verification?.status === "approved") {
    return (
      <div className="space-y-4 pt-4">
        <h1 className="text-xl font-bold">Verification</h1>
        <StatusBadge status="approved" />
        <p className="text-sm text-muted">You are a verified Yike agent.</p>
      </div>
    );
  }

  if (verification?.status === "pending") {
    return (
      <div className="space-y-4 pt-4">
        <h1 className="text-xl font-bold">Verification</h1>
        <StatusBadge status="pending" />
        <p className="text-sm text-muted">Your documents are under review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-xl font-bold">Agent verification</h1>
      <p className="text-sm text-muted">
        Upload document URLs (use Supabase Storage or any secure host). NIN
        encryption will be added when the NIN API is integrated.
      </p>
      {verification?.status === "rejected" && (
        <p className="text-sm text-danger">
          Rejected: {verification.rejection_reason ?? "Please resubmit."}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="id_document_url"
          placeholder="ID document image URL"
          required
        />
        <Input name="selfie_url" placeholder="Selfie image URL" required />
        {message && (
          <p className="text-sm text-primary">{message}</p>
        )}
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Submitting…" : "Submit for review"}
        </Button>
      </form>
    </div>
  );
}
