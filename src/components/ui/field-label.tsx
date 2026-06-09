import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FieldLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted",
        className
      )}
    >
      {children}
    </label>
  );
}
