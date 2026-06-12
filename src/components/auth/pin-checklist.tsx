"use client";

import { isStrongPin, pinChecks } from "@/lib/pin-policy";
import { cn } from "@/lib/utils";

const RULES = [
  { key: "length" as const, label: "Exactly 6 digits" },
  { key: "mixOfDigits" as const, label: "At least 3 different numbers" },
  { key: "maxTwoSame" as const, label: "No digit used more than twice" },
  { key: "noConsecutiveRun" as const, label: "No three numbers in a row" },
];

export function PinChecklist({ pin }: { pin: string }) {
  const checks = pinChecks(pin);
  const collapsed = isStrongPin(pin);

  if (!pin) return null;

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
        collapsed ? "grid-rows-[0fr] opacity-0 -mt-1" : "grid-rows-[1fr] opacity-100 mt-2"
      )}
      aria-hidden={collapsed}
    >
      <div className="overflow-hidden">
        <ul className="space-y-1 text-xs text-muted">
          {RULES.map(({ key, label }) => (
            <li
              key={key}
              className={cn(
                "flex items-center gap-1.5 transition-colors",
                checks[key] && "text-emerald-600 dark:text-emerald-400"
              )}
            >
              <span className="text-[10px]" aria-hidden>
                {checks[key] ? "✓" : "○"}
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
