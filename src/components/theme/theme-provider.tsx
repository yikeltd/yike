"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "yike-theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
}

/** Yike ships with one default theme — clean light, navy/gold branded. */
const DEFAULT_THEME: Theme = "light";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    applyTheme(DEFAULT_THEME);
    try {
      localStorage.setItem(STORAGE_KEY, DEFAULT_THEME);
    } catch {
      /* ignore */
    }
  }, []);

  const setTheme = useCallback((_next: Theme) => {
    applyTheme(DEFAULT_THEME);
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(DEFAULT_THEME);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
