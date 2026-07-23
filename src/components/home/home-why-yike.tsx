import { MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

const REASONS = [
  {
    icon: ShieldCheck,
    title: "Verified listings",
    body: "Property and vehicles go through Yike trust checks before they go live.",
  },
  {
    icon: Sparkles,
    title: "One marketplace",
    body: "Switch between homes and cars on the same homepage — same app, different content.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp-first",
    body: "Contact sellers the Nigerian way. No in-app chat required.",
  },
] as const;

export function HomeWhyYike() {
  return (
    <section className="mx-auto max-w-7xl px-3 py-10 lg:px-6 xl:px-8">
      <div className="mb-6 max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
          Why Yike
        </p>
        <h2 className="mt-1 text-2xl font-bold text-navy lg:text-3xl">
          Why choose Yike
        </h2>
        <p className="mt-2 text-sm text-muted lg:text-base">
          Nigeria&apos;s trusted marketplace for property and vehicles — built
          for mobile, speed, and real contact.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {REASONS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm ring-1 ring-black/[0.03]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/[0.06] text-navy">
              <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </span>
            <h3 className="mt-4 text-base font-bold text-navy">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
