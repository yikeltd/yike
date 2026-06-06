"use client";

import { useEffect } from "react";

/** Yike ships light theme only — no header toggle. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("yike-theme", "light");
    } catch {
      /* ignore */
    }
  }, []);

  return children;
}
