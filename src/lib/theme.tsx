import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Appearance = "light" | "dark" | "system";

const APPEARANCE_KEY = "study-planner:appearance";
const DARK_QUERY = "(prefers-color-scheme: dark)";

type ThemeValue = {
  appearance: Appearance;
  resolved: "light" | "dark";
  setAppearance: (appearance: Appearance) => void;
};

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

function readStoredAppearance(): Appearance {
  try {
    const stored = localStorage.getItem(APPEARANCE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // Storage can be unavailable (private mode); fall back to the default.
  }
  return "system";
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>(readStoredAppearance);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystemDark(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const resolved: "light" | "dark" = appearance === "system" ? (systemDark ? "dark" : "light") : appearance;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next);
    try {
      localStorage.setItem(APPEARANCE_KEY, next);
    } catch {
      // Persistence is best-effort; the in-memory choice still applies.
    }
  }, []);

  const value = useMemo<ThemeValue>(() => ({ appearance, resolved, setAppearance }), [appearance, resolved, setAppearance]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
