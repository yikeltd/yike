import { cn } from "@/lib/utils";

export function SeoHero({
  h1,
  description,
  vibe,
  className,
}: {
  h1: string;
  description: string;
  vibe?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 lg:mb-10", className)}>
      {vibe && (
        <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
          {vibe}
        </p>
      )}
      <h1 className="mt-2 text-2xl font-bold leading-tight text-navy lg:text-4xl">
        {h1}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted lg:text-base">
        {description}
      </p>
    </header>
  );
}
