import type { AboutMarketPulse } from "@/lib/about-market-pulse";

function formatCount(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k+`;
  return n.toLocaleString("en-NG");
}

export function AboutMarketStats({ pulse }: { pulse: AboutMarketPulse }) {
  const items = [
    { label: "Active listings", value: pulse.activeListings },
    { label: "Verified agents", value: pulse.verifiedAgents },
    { label: "Cities on Yike", value: pulse.citiesOnYike },
    { label: "WhatsApp connections", value: pulse.whatsappConnections },
  ];

  return (
    <section className="mt-8 lg:mt-10">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {items.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl bg-white px-4 py-4 shadow-float ring-1 ring-black/[0.04] lg:px-5 lg:py-5"
          >
            <p className="text-2xl font-bold tabular-nums text-navy lg:text-3xl">
              {formatCount(value)}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted lg:text-sm">
              {label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted lg:text-xs">
        Live counts from approved listings and agent verifications on Yike.
      </p>
    </section>
  );
}
