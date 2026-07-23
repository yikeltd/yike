import { Check } from "lucide-react";
import type { HeroTrustedAgentsConfig } from "@/lib/home/hero-trusted-agents";
import { cn } from "@/lib/utils";

const TRUST_POINTS = [
  "Verified Listings",
  "Verified Sellers",
  "Secure Marketplace",
] as const;

/**
 * Floating desktop-hero trust card — elegant, minimal checklist.
 * Config retained for API compatibility; buyer count is presentation copy.
 */
export function HomeDesktopTrustedAgentsCard({
  className,
}: {
  className?: string;
  /** Retained for call-site compatibility; trust card uses fixed launch copy. */
  config?: HeroTrustedAgentsConfig;
}) {

  return (
    <aside
      className={cn(
        "hidden w-[15.75rem] shrink-0 rounded-[1.35rem] border border-white/14 bg-[#021433]/55 px-5 py-5 shadow-[0_24px_56px_-20px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:block",
        className,
      )}
      aria-label="Trusted Across Nigeria"
    >
      <p className="text-[13px] font-semibold tracking-tight text-white/95">
        Trusted Across Nigeria
      </p>

      <ul className="mt-3.5 space-y-2.5">
        {TRUST_POINTS.map((label) => (
          <li key={label} className="flex items-center gap-2.5">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold"
              aria-hidden
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="text-[13px] font-medium text-white/88">{label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
