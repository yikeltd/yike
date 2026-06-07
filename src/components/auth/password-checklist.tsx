"use client";

import { isStrongPassword, passwordChecks } from "@/lib/password-policy";
import { cn } from "@/lib/utils";

const RULES = [
  { key: "minLength" as const, label: "At least 8 characters" },
  { key: "uppercase" as const, label: "One uppercase letter" },
  { key: "lowercase" as const, label: "One lowercase letter" },
  { key: "number" as const, label: "One number" },
];

export function PasswordChecklist({
  password,
  confirmPassword,
}: {
  password: string;
  confirmPassword: string;
}) {
  const checks = passwordChecks(password);
  const allPass = isStrongPassword(password);
  const matches = confirmPassword.length > 0 && password === confirmPassword;
  const collapsed = allPass && matches;

  if (!password && !confirmPassword) return null;

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
