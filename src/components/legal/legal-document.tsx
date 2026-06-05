import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function LegalDocument({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl space-y-8 pb-12 pt-4 lg:pt-8">
      <header className="space-y-2 border-b border-surface pb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
          Legal
        </p>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">{title}</h1>
        <p className="text-sm text-muted">Last updated: {lastUpdated}</p>
        <p className="text-sm text-muted">
          Questions?{" "}
          <Link href="/contact" className="font-semibold text-gold-dark hover:underline">
            Contact us
          </Link>
        </p>
      </header>
      <div className="legal-prose space-y-6 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </article>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-muted [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5">
        {children}
      </div>
    </section>
  );
}

export function LegalCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gold/25 bg-gold/10 px-4 py-3 text-sm text-foreground">
      {children}
    </div>
  );
}
