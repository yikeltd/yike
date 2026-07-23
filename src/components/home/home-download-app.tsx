import Link from "next/link";
import { Smartphone } from "lucide-react";

/** Compact install CTA — sits after listing rails, not before discovery. */
export function HomeDownloadApp() {
  return (
    <section className="mx-auto max-w-7xl px-3 pb-8 lg:px-6 xl:px-8">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-navy px-4 py-3 text-white sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold">
            <Smartphone className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </span>
          <p className="truncate text-sm font-bold sm:text-base">
            Get Yike on your phone
          </p>
        </div>
        <Link
          href="/"
          className="pressable inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-xl bg-gold px-4 text-sm font-bold text-navy"
        >
          Continue
        </Link>
      </div>
    </section>
  );
}
