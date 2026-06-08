"use client";

import { useEffect, useState } from "react";
import { VerificationTrustGate } from "@/components/verification/verification-trust-gate";
import type { VerificationTask } from "@/lib/verification/tasks";

type TrustStatus = {
  verificationRequired: boolean;
  tasks: VerificationTask[];
};

export function AgentTrustGateBanner() {
  const [status, setStatus] = useState<TrustStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/account/trust-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: TrustStatus | null) => {
        if (!cancelled && json?.verificationRequired) {
          setStatus(json);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status?.verificationRequired) return null;

  return (
    <div className="mx-auto max-w-2xl px-3 pt-3 lg:px-0">
      <VerificationTrustGate tasks={status.tasks} />
    </div>
  );
}
