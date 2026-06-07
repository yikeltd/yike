import { requireAuth } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { AgentListingsClient } from "@/components/agent/agent-listings-client";
import type { Property } from "@/types/database";

export default async function AgentListingsPage() {
  const user = await requireAuth("/auth/login?next=/agent/listings");
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false });

  return <AgentListingsClient listings={(data ?? []) as Property[]} />;
}
