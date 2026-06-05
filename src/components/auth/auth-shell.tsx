import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mesh-hero relative overflow-hidden px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
        <div
          className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-gold/25 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-md">
          <Logo href="/" showText className="text-white [&_span]:text-white" />
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-2 text-base leading-relaxed text-white/75">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="relative -mt-6 mx-auto max-w-md px-4 pb-10">
        <div className="rounded-3xl border border-black/[0.06] bg-elevated p-6 shadow-float-lg ring-1 ring-gold/10 dark:border-white/10">
          {children}
        </div>
        {footer && <div className="mt-6 text-center">{footer}</div>}
      </div>
    </div>
  );
}
