"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchCollapsible({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-surface bg-white shadow-sm dark:bg-elevated",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pressable flex w-full items-center justify-between px-3.5 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy/70 dark:text-muted">
          {Icon ? <Icon className="h-3.5 w-3.5 text-gold" /> : null}
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-surface px-3.5 pb-3.5 pt-2.5">{children}</div>
        </div>
      </div>
    </section>
  );
}
