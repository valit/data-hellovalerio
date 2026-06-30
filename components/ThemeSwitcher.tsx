"use client";

import { useTheme, type Theme } from "./ThemeProvider";

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀" },
  { value: "system", label: "System", icon: "⊙" },
  { value: "dark",  label: "Dark",   icon: "☾" },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 text-xs"
      role="group"
      aria-label="Color theme"
    >
      {OPTIONS.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          aria-pressed={theme === value}
          className={`px-2.5 py-1.5 transition-colors flex items-center gap-1 ${
            theme === value
              ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100"
              : "bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <span aria-hidden>{icon}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
