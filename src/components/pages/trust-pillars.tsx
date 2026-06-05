import type { LucideIcon } from "lucide-react";
import { ShieldCheck, BadgeCheck, MessageCircle, Eye } from "lucide-react";

const DEFAULT: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: BadgeCheck,
    title: "Verified agents",
    body: "Identity-checked agents rank higher. Look for the Verified badge before you pay anyone.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp-first",
    body: "Chat directly with agents. No middleman fees through Yike — inspect first, pay when satisfied.",
  },
  {
    icon: Eye,
    title: "Inspect in person",
    body: "Never pay large sums before visiting the property. Walk the unit, check water, light and access roads.",
  },
  {
    icon: ShieldCheck,
    title: "Report suspicious listings",
    body: "See something off? Report it. We hide fake listings and ban repeat offenders.",
  },
];

export function TrustPillars({
  items = DEFAULT,
  title = "Why renters trust Yike",
}: {
  items?: { icon: LucideIcon; title: string; body: string }[];
  title?: string;
}) {
  return (
    <section className="mt-10 px-3 lg:mt-14 lg:px-0">
      <h2 className="text-xl font-bold text-navy lg:text-2xl">{title}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title: t, body }) => (
          <div
            key={t}
            className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
              <Icon className="h-5 w-5 text-gold-dark" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-navy">{t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
