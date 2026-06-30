"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  isDark: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function useChartTheme() {
  const { isDark } = useTheme();
  return {
    grid: isDark ? "#27272a" : "#e4e4e7",
    tick: "#71717a",
    axisLabel: isDark ? "#a1a1aa" : "#52525b",
    tooltipStyle: {
      background: isDark ? "#18181b" : "#ffffff",
      border: isDark ? "1px solid #3f3f46" : "1px solid #e4e4e7",
      borderRadius: 8,
    },
    tooltipLabelStyle: { color: isDark ? "#a1a1aa" : "#52525b" },
    tooltipItemStyle: { color: isDark ? "#e4e4e7" : "#18181b" },
    refAreaFill: isDark ? "#ffffff" : "#000000",
  };
}

function systemIsDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveIsDark(t: Theme): boolean {
  if (t === "dark") return true;
  if (t === "light") return false;
  return systemIsDark();
}

function applyDarkClass(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [isDark, setIsDark] = useState(true);

  // Read localStorage on mount and sync with what the inline script already applied
  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setThemeState(stored);
    setIsDark(resolveIsDark(stored));
    // The class is already set by the inline script; no need to toggle again
  }, []);

  // Live-update when OS preference changes and user is on "system"
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        setIsDark(e.matches);
        applyDarkClass(e.matches);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("theme", t);
    const dark = resolveIsDark(t);
    setIsDark(dark);
    applyDarkClass(dark);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
