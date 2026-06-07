"use client";

import { AgentVerificationActions } from "@/components/admin/agent-verification-actions";

export function AdminAgentVerificationSection({
  agentId,
  verificationId,
}: {
  agentId: string;
  verificationId: string;
}) {
  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-bold text-navy">Agent verification</h2>
      <AgentVerificationActions verificationId={verificationId} agentId={agentId} />
    </section>
  );
}
