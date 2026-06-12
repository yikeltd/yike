import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { AgentPlansClient } from "@/components/subscriptions/agent-plans-client";

export default async function AgentPlansPage() {
  await requireAuth("/auth/login?next=/agent/plans");

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-3 py-8 text-sm text-muted">Loading plans…</div>
      }
    >
      <AgentPlansClient />
    </Suspense>
  );
}
