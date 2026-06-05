import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ShieldCheck, Home, MessageCircle } from "lucide-react";

const TRUST_POINTS = [
  { icon: ShieldCheck, text: "Verified agents & landlords" },
  { icon: Home, text: "Rent, buy, shortlet & land" },
  { icon: MessageCircle, text: "WhatsApp contact on every listing" },
];

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
      <div className="mesh-hero relative overflow-hidden px-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))]">
        <div
          className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-gold/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-24 h-40 w-40 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-md">
          <Logo href="/" showText className="text-white [&_span]:text-white" />
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-2 text-base leading-relaxed text-white/80">
            {subtitle}
          </p>

          <ul className="mt-6 flex flex-col gap-2.5">
            {TRUST_POINTS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2.5 text-sm text-white/70"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-3.5 w-3.5 text-gold" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative -mt-8 mx-auto max-w-md px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="rounded-3xl border border-black/[0.06] bg-elevated p-6 shadow-float-lg ring-1 ring-gold/10 dark:border-white/10 dark:bg-elevated">
          {children}
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-muted">
          Trusted by renters and agents across Lagos, Abuja, Port Harcourt, Aba
          &amp; more.
        </p>

        {footer && <div className="mt-5 text-center">{footer}</div>}

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/terms" className="underline-offset-2 hover:underline">
            Terms
          </Link>
          {" · "}
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}
