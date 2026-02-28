"use client";

import type { Category, Severity } from "@/types/events";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "conflict", label: "Conflict" },
  { value: "military", label: "Military" },
  { value: "diplomatic", label: "Diplomatic" },
  { value: "political", label: "Political" },
  { value: "humanitarian", label: "Humanitarian" },
];

const SEVERITIES: {
  value: Severity;
  label: string;
  color: string;
}[] = [
  { value: "critical", label: "Critical", color: "#e63946" },
  { value: "high", label: "High", color: "#e87d2f" },
  { value: "medium", label: "Medium", color: "#c9a227" },
  { value: "low", label: "Low", color: "#3b82f6" },
];

interface FiltersProps {
  activeCategory?: Category;
  activeSeverity?: Severity;
  onCategoryChange: (cat?: Category) => void;
  onSeverityChange: (sev?: Severity) => void;
}

export default function Filters({
  activeCategory,
  activeSeverity,
  onCategoryChange,
  onSeverityChange,
}: FiltersProps) {
  return (
    <div className="filter-bar flex items-center gap-3 px-5 py-2 border-b border-white/[0.04] overflow-x-auto">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-gray-600 font-[family-name:var(--font-jetbrains)] tracking-[0.08em] uppercase mr-1">
          Category
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() =>
              onCategoryChange(
                activeCategory === cat.value ? undefined : cat.value
              )
            }
            className={`filter-chip px-2.5 py-1 rounded text-[12px] font-medium cursor-pointer ${
              activeCategory === cat.value
                ? "filter-chip-active"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="w-px h-4 bg-white/[0.06] shrink-0" />
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-gray-600 font-[family-name:var(--font-jetbrains)] tracking-[0.08em] uppercase mr-1">
          Severity
        </span>
        {SEVERITIES.map((sev) => (
          <button
            key={sev.value}
            onClick={() =>
              onSeverityChange(
                activeSeverity === sev.value ? undefined : sev.value
              )
            }
            className={`filter-chip px-2.5 py-1 rounded text-[12px] font-medium flex items-center gap-1.5 cursor-pointer ${
              activeSeverity === sev.value
                ? "filter-chip-active"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                background: sev.color,
                boxShadow: `0 0 4px ${sev.color}55`,
              }}
            />
            {sev.label}
          </button>
        ))}
      </div>
      {(activeCategory || activeSeverity) && (
        <>
          <div className="w-px h-4 bg-white/[0.06] shrink-0" />
          <button
            onClick={() => {
              onCategoryChange(undefined);
              onSeverityChange(undefined);
            }}
            className="px-2 py-1 rounded text-[11px] text-red-400/70 hover:text-red-300 hover:bg-red-950/30 transition-colors shrink-0 font-[family-name:var(--font-jetbrains)] tracking-wide cursor-pointer"
          >
            CLEAR
          </button>
        </>
      )}
    </div>
  );
}
