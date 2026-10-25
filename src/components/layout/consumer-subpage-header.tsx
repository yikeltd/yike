import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { consumerRoute, type ConsumerRouteKey } from "@/lib/navigation/consumer-routes";

type Props = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
};

export function ConsumerSubpageHeader({
  title,
  subtitle,
  backHref = consumerRoute("home"),
  backLabel = "Back to home",
}: Props) {
  return (
    <header className="mb-6 space-y-3">
      <Link
        href={backHref}
        className="pressable inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-navy/70 hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {backLabel}
      </Link>
      <div>
        <h1 className="text-xl font-black text-navy">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-navy/60">{subtitle}</p> : null}
      </div>
    </header>
  );
}

/** Typed back targets for account subpages */
export function consumerSubpageBack(key: ConsumerRouteKey): string {
  return consumerRoute(key);
}
