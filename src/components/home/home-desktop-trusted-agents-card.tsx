import Image from "next/image";
import Link from "next/link";
import { UserAvatar } from "@/components/profile/user-avatar";
import type { HeroTrustedAgentsConfig } from "@/lib/home/hero-trusted-agents";
import { cn } from "@/lib/utils";

function AgentAvatar({
  agent,
  className,
  style,
}: {
  agent: HeroTrustedAgentsConfig["agents"][number];
  className?: string;
  style?: React.CSSProperties;
}) {
  const content = agent.avatarUrl ? (
    <Image
      src={agent.avatarUrl}
      alt={agent.name}
      width={44}
      height={44}
      className="h-full w-full object-cover"
    />
  ) : (
    <UserAvatar
      name={agent.name}
      size="sm"
      className="!h-full !w-full !rounded-full !text-xs"
    />
  );

  const inner = agent.profileSlug ? (
    <Link
      href={`/agents/${agent.profileSlug}`}
      className="block h-full w-full overflow-hidden rounded-full"
      title={agent.name}
    >
      {content}
    </Link>
  ) : (
    <div className="h-full w-full overflow-hidden rounded-full" title={agent.name}>
      {content}
    </div>
  );

  return (
    <div
      className={cn(
        "relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-[#021433]/90",
        className
      )}
      style={style}
    >
      {inner}
    </div>
  );
}

export function HomeDesktopTrustedAgentsCard({
  className,
  config,
}: {
  className?: string;
  config: HeroTrustedAgentsConfig;
}) {
  const maxVisible = config.maxVisible ?? 4;
  const visible = config.agents.slice(0, maxVisible);

  return (
    <aside
      className={cn(
        "hidden w-[15.5rem] shrink-0 rounded-[1.35rem] border border-white/14 bg-[#021433]/55 px-5 py-4 shadow-[0_24px_56px_-20px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:block",
        className
      )}
      aria-label="Trusted agents"
    >
      <p className="text-sm font-semibold text-white/92">{config.headlineTop}</p>

      <div className="mt-3 flex items-center pl-1">
        {visible.map((agent, index) => (
          <AgentAvatar
            key={agent.id}
            agent={agent}
            className={cn(index > 0 && "-ml-3")}
            style={{ zIndex: visible.length - index }}
          />
        ))}
        <div
          className="-ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-navy ring-2 ring-[#021433]/90"
          style={{ zIndex: 0 }}
          aria-hidden
        >
          {config.overflowLabel}
        </div>
      </div>

      <p className="mt-3 text-xs font-medium text-white/68">
        {config.headlineBottom}
      </p>
    </aside>
  );
}
