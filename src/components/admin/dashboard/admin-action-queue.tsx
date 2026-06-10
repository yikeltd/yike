import Link from "next/link";
import { adminListingsPath, adminPath } from "@/lib/admin-paths";
import type { AdminNavBadges } from "@/lib/admin/navigation";

const ACTION_LINKS: {
  badgeKey: keyof AdminNavBadges | string;
  label: string;
  href: string;
  variant: "warning" | "danger" | "default";
}[] = [
  {
    badgeKey: "pending-reviews",
    label: "Pending reviews",
    href: adminListingsPath("pending"),
    variant: "warning",
  },
  {
    badgeKey: "open-reports",
    label: "Unresolved reports",
    href: adminPath("reports"),
    variant: "danger",
  },
  {
    badgeKey: "trust-queue",
    label: "Trust escalations",
    href: adminPath("trust-review-queue"),
    variant: "danger",
  },
  {
    badgeKey: "duplicate-flags",
    label: "Duplicate flags",
    href: adminPath("duplicates"),
    variant: "warning",
  },
  {
    badgeKey: "expiring-listings",
    label: "Expiring soon",
    href: adminPath("expiring-listings"),
    variant: "default",
  },
  {
    badgeKey: "pricing-warnings",
    label: "Pricing warnings",
    href: adminPath("pricing-warnings"),
    variant: "warning",
  },
];

export function AdminActionQueue({ badges }: { badges: AdminNavBadges }) {
  const items = ACTION_LINKS.filter(
    (item) => (badges[item.badgeKey] ?? 0) > 0
  );

  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
        <p className="text-sm font-bold text-emerald-900">All clear</p>
        <p className="mt-1 text-xs text-emerald-800/80">
          No urgent marketplace or trust queues need action right now.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-navy">Needs attention</h2>
      <p className="mt-0.5 text-xs text-muted">
        Jump straight to operational queues — sorted by urgency
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const count = badges[item.badgeKey] ?? 0;
          return (
            <li key={item.badgeKey}>
              <Link
                href={item.href}
                className="pressable flex items-center justify-between gap-2 rounded-xl border border-navy/8 bg-surface/50 px-3 py-3 transition-colors hover:border-gold/30 hover:bg-gold/5"
              >
                <span className="text-sm font-semibold text-navy">
                  {item.label}
                </span>
                <span
                  className={
                    item.variant === "danger"
                      ? "rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold tabular-nums text-red-800"
                      : item.variant === "warning"
                        ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-900"
                        : "rounded-full bg-navy/10 px-2 py-0.5 text-xs font-bold tabular-nums text-navy"
                  }
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
