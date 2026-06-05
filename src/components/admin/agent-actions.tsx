"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function AgentActions({
  agentId,
  verificationId,
}: {
  agentId: string;
  verificationId?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function verify() {
    await supabase
      .from("profiles")
      .update({ verification_status: "approved" })
      .eq("id", agentId);
    if (verificationId) {
      await supabase
        .from("agent_verifications")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", verificationId);
    }
    router.refresh();
  }

  async function reject() {
    await supabase
      .from("profiles")
      .update({ verification_status: "rejected" })
      .eq("id", agentId);
    if (verificationId) {
      await supabase
        .from("agent_verifications")
        .update({
          status: "rejected",
          rejection_reason: "Did not meet verification requirements",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", verificationId);
    }
    router.refresh();
  }

  async function ban() {
    await supabase
      .from("profiles")
      .update({ is_banned: true })
      .eq("id", agentId);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={verify}>
        Verify agent
      </Button>
      <Button size="sm" variant="outline" onClick={reject}>
        Reject
      </Button>
      <Button size="sm" variant="danger" onClick={ban}>
        Ban
      </Button>
    </div>
  );
}
