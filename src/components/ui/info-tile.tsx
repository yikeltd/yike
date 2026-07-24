import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type InfoTileProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  className?: string;
};

/** Premium info tile — icon + muted label + strong value (not a flat gray box). */
export function InfoTile({ icon: Icon, label, value, className }: InfoTileProps) {
  return (
    <div
      className={cn(
        "info-tile flex min-h-[4.5rem] flex-col justify-center gap-1 p-3.5 sm:p-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-navy/[0.06] text-navy dark:bg-white/10 dark:text-gold"
          aria-hidden
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </span>
      </div>
      <p className="pl-10 text-sm font-bold leading-snug text-navy dark:text-foreground">
        {value}
      </p>
    </div>
  );
}

export type SpecItem = {
  icon: LucideIcon;
  label: string;
  value: string | number | null | undefined;
};

export function SpecTileGrid({
  items,
  className,
  columns = 2,
}: {
  items: SpecItem[];
  className?: string;
  columns?: 2 | 3 | 4;
}) {
  const visible = items.filter(
    (i) => i.value != null && String(i.value).trim() !== ""
  );
  if (visible.length === 0) return null;

  return (
    <div
      className={cn(
        "grid gap-2.5 sm:gap-3",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
        className
      )}
      role="list"
    >
      {visible.map((item) => (
        <div key={item.label} role="listitem">
          <InfoTile icon={item.icon} label={item.label} value={item.value!} />
        </div>
      ))}
    </div>
  );
}

export function SpecSection({
  title,
  items,
  className,
}: {
  title: string;
  items: SpecItem[];
  className?: string;
}) {
  const visible = items.filter(
    (i) => i.value != null && String(i.value).trim() !== ""
  );
  if (visible.length === 0) return null;

  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
        {title}
      </h3>
      <SpecTileGrid items={visible} columns={2} />
    </section>
  );
}
