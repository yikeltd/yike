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
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-navy/5 text-navy hover:bg-navy/10"
              aria-label="Back"
            >
              ←
            </Link>
          ) : null}
          <h1 className="text-xl font-black tracking-tight text-navy sm:text-2xl uppercase">
            SELL ON YIKE
          </h1>
        </div>
      </header>
      {children}
    </main>
  );
}
