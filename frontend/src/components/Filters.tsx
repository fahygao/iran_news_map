"use client";

import type { Category, Severity } from "@/types/events";
import { useI18n } from "@/lib/i18n";

const CATEGORIES: { value: Category; key: string }[] = [
  { value: "conflict", key: "cat.conflict" },
  { value: "military", key: "cat.military" },
  { value: "diplomatic", key: "cat.diplomatic" },
  { value: "political", key: "cat.political" },
  { value: "humanitarian", key: "cat.humanitarian" },
];

const SEVERITIES: {
  value: Severity;
  key: string;
  color: string;
}[] = [
  { value: "critical", key: "sev.critical", color: "#e63946" },
  { value: "high", key: "sev.high", color: "#e87d2f" },
  { value: "medium", key: "sev.medium", color: "#c9a227" },
  { value: "low", key: "sev.low", color: "#3b82f6" },
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
  const { t } = useI18n();

  return (
    <div className="filter-bar flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 border-b border-white/[0.04] overflow-x-auto">
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <span className="text-[9px] sm:text-[10px] text-gray-600 font-[family-name:var(--font-jetbrains)] tracking-[0.08em] uppercase mr-0.5 sm:mr-1">
          {t("filter.category")}
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() =>
              onCategoryChange(
                activeCategory === cat.value ? undefined : cat.value
              )
            }
            className={`filter-chip px-2 sm:px-2.5 py-1 rounded text-[11px] sm:text-[12px] font-medium cursor-pointer ${
              activeCategory === cat.value
                ? "filter-chip-active"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t(cat.key)}
          </button>
        ))}
      </div>
      <div className="w-px h-4 bg-white/[0.06] shrink-0" />
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <span className="text-[9px] sm:text-[10px] text-gray-600 font-[family-name:var(--font-jetbrains)] tracking-[0.08em] uppercase mr-0.5 sm:mr-1">
          {t("filter.severity")}
        </span>
        {SEVERITIES.map((sev) => (
          <button
            key={sev.value}
            onClick={() =>
              onSeverityChange(
                activeSeverity === sev.value ? undefined : sev.value
              )
            }
            className={`filter-chip px-2 sm:px-2.5 py-1 rounded text-[11px] sm:text-[12px] font-medium flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
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
            {t(sev.key)}
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
            {t("filter.clear")}
          </button>
        </>
      )}
    </div>
  );
}
