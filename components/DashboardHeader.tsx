"use client";

import ThemeSwitcher from "./ThemeSwitcher";

export default function DashboardHeader() {
  const now = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 px-8 py-5 flex items-center justify-between bg-white dark:bg-zinc-950">
      <div>
        <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Analytics
        </h1>
        <p className="text-zinc-500 text-xs mt-0.5" suppressHydrationWarning>
          hellovaler.io · as of {now}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <form action="/api/logout" method="POST">
          <button
            type="submit"
            className="text-xs text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
