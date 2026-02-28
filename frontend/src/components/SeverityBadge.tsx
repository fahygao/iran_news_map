"use client";

import type { Severity } from "@/types/events";
import { useI18n } from "@/lib/i18n";

const severityConfig: Record<
  Severity,
  { bg: string; text: string; key: string; glow: string }
> = {
  critical: {
    bg: "rgba(230, 57, 70, 0.15)",
    text: "#f5a3aa",
    key: "badge.critical",
    glow: "rgba(230, 57, 70, 0.25)",
  },
  high: {
    bg: "rgba(232, 125, 47, 0.15)",
    text: "#f0b88a",
    key: "badge.high",
    glow: "rgba(232, 125, 47, 0.25)",
  },
  medium: {
    bg: "rgba(201, 162, 39, 0.15)",
    text: "#dbc96e",
    key: "badge.medium",
    glow: "rgba(201, 162, 39, 0.2)",
  },
  low: {
    bg: "rgba(59, 130, 246, 0.15)",
    text: "#93b8f5",
    key: "badge.low",
    glow: "rgba(59, 130, 246, 0.2)",
  },
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const { t } = useI18n();
  const config = severityConfig[severity] || severityConfig.medium;
  return (
    <span
      className="inline-block px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold font-[family-name:var(--font-jetbrains)] tracking-[0.06em]"
      style={{
        background: config.bg,
        color: config.text,
        boxShadow: `inset 0 0 8px ${config.glow}`,
      }}
    >
      {t(config.key)}
    </span>
  );
}
