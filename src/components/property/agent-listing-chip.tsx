import Link from "next/link";
import { UserAvatar } from "@/components/profile/user-avatar";
import type { Profile } from "@/types/database";
import { agentPublicPath } from "@/lib/agent-slugs";

export function AgentListingChip({ agent }: { agent: Profile }) {
  const name = agent.full_name ?? agent.username ?? "Agent";

  return (
    <Link
      href={agentPublicPath(agent)}
      onClick={(e) => e.stopPropagation()}
      className="pressable mt-3 flex items-center gap-2.5 rounded-xl bg-surface/80 px-2.5 py-2 ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
    >
      <UserAvatar name={name} avatarUrl={agent.avatar_url} size="sm" className="rounded-xl" />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-navy">{name}</p>
        <p className="text-[10px] text-muted">Listed by this agent</p>
      </div>
    </Link>
  );
}
