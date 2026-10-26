import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared seller-journey chrome — compact header aligned with YDS tokens.
 */
export function SellerFlowShell({
  eyebrow,
  title,
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
        "yike-browse-canvas min-h-[100dvh] pb-20 pt-3 sm:px-5",
        className,
      )}
    >
      <div className={cn("mx-auto w-full px-4", width)}>
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {backHref ? (
              <Link
                href={backHref}
                className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy hover:bg-navy/10"
                aria-label={backLabel}
              >
                ←
              </Link>
            ) : null}
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-[10px] font-bold uppercase tracking-wider text-gold-dark">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="truncate text-lg font-black text-navy sm:text-xl">{title}</h1>
            </div>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
        {children}
      </div>
    </main>
  );
}
