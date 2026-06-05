import Link from "next/link";

export function CtaBanner({
  title,
  body,
  primary,
  secondary,
  variant = "navy",
}: {
  title: string;
  body: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  variant?: "navy" | "gold";
}) {
  const isGold = variant === "gold";
  return (
    <section
      className={`full-bleed mt-12 px-6 py-10 lg:py-14 ${
        isGold ? "bg-gold/15" : "bg-navy"
      }`}
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          className={`text-xl font-bold lg:text-2xl ${
            isGold ? "text-navy" : "text-white"
          }`}
        >
          {title}
        </h2>
        <p
          className={`mt-3 text-sm lg:text-base ${
            isGold ? "text-muted" : "text-white/80"
          }`}
        >
          {body}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={primary.href}
            className={`pressable inline-flex min-h-[48px] items-center rounded-xl px-6 text-sm font-bold ${
              isGold
                ? "bg-navy text-white"
                : "bg-gold text-navy shadow-glow-gold"
            }`}
          >
            {primary.label}
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className={`pressable inline-flex min-h-[48px] items-center rounded-xl px-6 text-sm font-bold ${
                isGold
                  ? "border border-navy/20 text-navy"
                  : "bg-white/10 text-white"
              }`}
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
