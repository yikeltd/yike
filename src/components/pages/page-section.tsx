import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageSection({
  title,
  subtitle,
  href,
  linkLabel = "See all",
  children,
  className,
  id,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mt-10 lg:mt-14", className)}>
      <div className="mb-4 flex items-end justify-between px-3 lg:px-0">
        <div>
          <h2 className="text-xl font-bold text-navy lg:text-2xl">{title}</h2>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm text-muted lg:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="shrink-0 text-sm font-bold text-gold-dark hover:underline"
          >
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
