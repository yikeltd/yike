import Link from "next/link";
import { adminPath, TECH_BASE_PATH } from "@/lib/admin-paths";
import type {
  HealthTone,
  LaunchHealthSnapshot,
} from "@/lib/admin/launch-health";
import { cn } from "@/lib/utils";

function toneDot(tone: HealthTone): string {
  switch (tone) {
    case "ok":
      return "bg-emerald-500";
    case "warn":
      return "bg-amber-400";
    case "fail":
      return "bg-red-500";
    default:
      return "bg-navy/25";
  }
}

function toneLabel(tone: HealthTone): string {
  switch (tone) {
    case "ok":
      return "Healthy";
    case "warn":
      return "Attention";
    case "fail":
      return "Down";
    default:
      return "N/A";
  }
}

function Stat({
  label,
  value,
  href,
  warn,
}: {
  label: string;
  value: number;
  href?: string;
  warn?: boolean;
}) {
  const body = (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3",
        warn
          ? "border-amber-200 bg-amber-50"
          : "border-navy/8 bg-white",
      )}
    >
      <p className="text-2xl font-black tabular-nums text-navy">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-navy/65">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function LaunchHealthDashboard({
  snapshot,
}: {
  snapshot: LaunchHealthSnapshot;
}) {
  const { systems, marketplace, today, smsBypassActive, overall, generatedAt } =
    snapshot;

  return (
    <div className="space-y-6">
      {smsBypassActive ? (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950"
        >
          Testing Mode — SMS verification bypass is active. Set{" "}
          <code className="rounded bg-amber-100 px-1">AUTH_SMS_VERIFICATION_ENABLED=true</code>{" "}
          before public launch.
        </div>
      ) : null}

      <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-navy/45">
              System status
            </h2>
            <p className="mt-1 text-xs text-muted">
              Overall:{" "}
              <span className="font-bold text-navy">{toneLabel(overall)}</span>
              {" · "}
              Updated {new Date(generatedAt).toLocaleString("en-NG")}
            </p>
          </div>
          <Link
            href={TECH_BASE_PATH}
            className="text-xs font-bold text-gold-dark hover:underline"
          >
            Tech console →
          </Link>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {systems.map((s) => (
            <li
              key={s.id}
              className="flex items-start gap-3 rounded-xl border border-navy/6 bg-[#f8f9fc] px-3 py-2.5"
            >
              <span
                className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", toneDot(s.tone))}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-navy">{s.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-navy/50">
                  {s.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-navy/45">
          Marketplace
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat
            label="Vehicles"
            value={marketplace.vehicles}
            href={`${adminPath("listings")}?vertical=vehicle`}
          />
          <Stat
            label="Properties"
            value={marketplace.properties}
            href={`${adminPath("listings")}?vertical=property`}
          />
          <Stat
            label="Dealers"
            value={marketplace.dealers}
            href={adminPath("agents")}
          />
          <Stat
            label="Pending listings"
            value={marketplace.pendingListings}
            href={adminPath("listings/review")}
            warn={marketplace.pendingListings > 0}
          />
          <Stat
            label="Pending reports"
            value={marketplace.pendingReports}
            href={adminPath("reports")}
            warn={marketplace.pendingReports > 0}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-navy/45">
          Today&apos;s activity
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="New users" value={today.newUsers} />
          <Stat label="New listings" value={today.newListings} />
          <Stat label="Searches" value={today.searches} />
          <Stat label="Contact attempts" value={today.contactAttempts} />
          <Stat label="Saves" value={today.saves} />
        </div>
      </section>
    </div>
  );
}
