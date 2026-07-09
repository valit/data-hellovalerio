"use client";

import { useDateRange } from "@/context/DateRange";

const TYPE_LABEL: Record<string, string> = {
  page: "Page",
  source: "Source",
  geo: "Location",
};

const RESET_BTN = "text-xs px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors font-medium";

export default function FilterChips() {
  const { isFiltered, rangeLabel, reset, dimensionFilters, removeFilter, clearDimensionFilters } = useDateRange();

  const hasAny = isFiltered || dimensionFilters.length > 0;
  if (!hasAny) return null;

  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 flex-wrap px-8 py-3 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
      <span className="text-xs text-zinc-500 dark:text-zinc-500 font-medium shrink-0">
        Filtering by:
      </span>

      {/* Date range chip — comes first as it's the coarsest filter */}
      {isFiltered && (
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-sm">
          <span className="text-zinc-400 dark:text-zinc-500 font-medium">Date:</span>
          <span className="font-medium">{rangeLabel}</span>
          <button
            onClick={reset}
            className="ml-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors leading-none"
            aria-label="Remove date filter"
          >
            ×
          </button>
        </span>
      )}

      {/* Dimension filter chips */}
      {dimensionFilters.map((f) => (
        <span
          key={f.id}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-sm"
        >
          <span className="text-zinc-400 dark:text-zinc-500 font-medium">
            {TYPE_LABEL[f.type] ?? f.type}:
          </span>
          <span className="font-medium">{f.label}</span>
          <button
            onClick={() => removeFilter(f.id)}
            className="ml-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors leading-none"
            aria-label={`Remove ${f.label} filter`}
          >
            ×
          </button>
        </span>
      ))}

      {/* Clear all — only when 2+ total active filters */}
      {(isFiltered ? 1 : 0) + dimensionFilters.length > 1 && (
        <button
          onClick={() => { reset(); clearDimensionFilters(); }}
          className={RESET_BTN}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
