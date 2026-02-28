import type { Severity } from "@/types/events";

const severityConfig: Record<
  Severity,
  { bg: string; text: string; label: string; glow: string }
> = {
  critical: {
    bg: "rgba(230, 57, 70, 0.15)",
    text: "#f5a3aa",
    label: "CRITICAL",
    glow: "rgba(230, 57, 70, 0.25)",
  },
  high: {
    bg: "rgba(232, 125, 47, 0.15)",
    text: "#f0b88a",
    label: "HIGH",
    glow: "rgba(232, 125, 47, 0.25)",
  },
  medium: {
    bg: "rgba(201, 162, 39, 0.15)",
    text: "#dbc96e",
    label: "MED",
    glow: "rgba(201, 162, 39, 0.2)",
  },
  low: {
    bg: "rgba(59, 130, 246, 0.15)",
    text: "#93b8f5",
    label: "LOW",
    glow: "rgba(59, 130, 246, 0.2)",
  },
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const config = severityConfig[severity] || severityConfig.medium;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold font-[family-name:var(--font-jetbrains)] tracking-[0.06em]"
      style={{
        background: config.bg,
        color: config.text,
        boxShadow: `inset 0 0 8px ${config.glow}`,
      }}
    >
      {config.label}
    </span>
  );
}
