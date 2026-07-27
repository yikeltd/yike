import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared seller-journey chrome — matches homepage premium spacing/typography.
 * Presentation only.
 */
export function SellerFlowShell({
  eyebrow,
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
  children,
  className,
  maxWidth = "lg",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "md" | "lg" | "xl";
}) {
  const width =
    maxWidth === "md"
      ? "max-w-lg"
      : maxWidth === "xl"
        ? "max-w-3xl"
        : "max-w-2xl";

  return (
    <main
      className={cn(
        "mx-auto w-full space-y-5 px-4 pb-14 pt-5 sm:px-5",
        width,
        className,
      )}
    >
      <header className="space-y-3">
        {(backHref || actions) && (
          <div className="flex items-center justify-between gap-3">
            {backHref ? (
              <Link
                href={backHref}
                className="pressable text-sm font-semibold text-navy/55 transition hover:text-navy"
              >
                ← {backLabel}
              </Link>
            ) : (
              <span />
            )}
            {actions}
          </div>
        )}
        <div>
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy sm:text-[1.75rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-md text-sm leading-relaxed text-navy/55">
              {description}
            </p>
          ) : null}
        </div>
      </header>
      {children}
    </main>
  );
}
