"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  inverted,
}: {
  className?: string;
  inverted?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
        inverted
          ? "border border-white/15 bg-white/10 text-white hover:border-gold/40 hover:bg-gold/15"
          : "border border-surface bg-elevated text-foreground shadow-float hover:border-gold/30 hover:bg-gold/10",
        className
      )}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px] text-gold" strokeWidth={2.25} />
      ) : (
        <Moon className="h-[18px] w-[18px] text-navy" strokeWidth={2.25} />
      )}
    </button>
  );
}
