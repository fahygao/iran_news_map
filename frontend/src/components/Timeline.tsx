"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { TimelineDay, Category, Severity } from "@/types/events";
import { getTimelineEvents } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import SeverityBadge from "./SeverityBadge";

interface TimelineProps {
  category?: Category;
  severity?: Severity;
  days?: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#e63946",
  high: "#e87d2f",
  medium: "#c9a227",
  low: "#3b82f6",
};

export default function Timeline({
  category,
  severity,
  days = 7,
}: TimelineProps) {
  const { t } = useI18n();
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function getRelativeDate(dateStr: string): { label: string; isToday: boolean } {
    const date = new Date(dateStr + "T00:00:00");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.floor(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff === 0) return { label: t("timeline.today"), isToday: true };
    if (diff === 1) return { label: t("timeline.yesterday"), isToday: false };
    if (diff < 7) return { label: `${diff} ${t("timeline.daysAgo")}`, isToday: false };

    return {
      label: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      isToday: false,
    };
  }

  function getSeverityCounts(
    events: { severity: Severity }[]
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const e of events) {
      counts[e.severity] = (counts[e.severity] || 0) + 1;
    }
    return counts;
  }

  const fetchData = useCallback(async () => {
    try {
      const data = await getTimelineEvents({ days, category, severity });
      setTimeline(data.timeline);
      if (data.timeline.length > 0) {
        const lastDay = data.timeline[data.timeline.length - 1];
        const date = new Date(lastDay.date + "T00:00:00");
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diff = Math.floor(
          (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff === 0) {
          setExpandedDays((prev) => new Set([...prev, lastDay.date]));
        }
      }
    } catch (err) {
      console.error("Failed to load timeline:", err);
    } finally {
      setLoading(false);
    }
  }, [days, category, severity]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchData();
    }, 120_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2.5">
          <div className="status-dot" />
          <span className="text-[12px] sm:text-[13px] text-gray-500 font-[family-name:var(--font-jetbrains)] tracking-wide">
            {t("timeline.loading")}
          </span>
        </div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600 text-[12px] sm:text-[13px] font-[family-name:var(--font-jetbrains)]">
        {t("timeline.noEvents")}
      </div>
    );
  }

  const reversed = [...timeline].reverse();

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
      {reversed.map((day) => {
        const { label, isToday } = getRelativeDate(day.date);
        const counts = getSeverityCounts(day.events);
        const isExpanded = expandedDays.has(day.date);

        return (
          <div key={day.date} className="mb-4 sm:mb-6">
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 group cursor-pointer"
            >
              <div className="relative shrink-0">
                {isToday ? (
                  <div className="status-dot" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-700" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <h3
                  className={`text-[13px] sm:text-[14px] font-semibold ${
                    isToday ? "text-gray-100" : "text-gray-400"
                  }`}
                >
                  {label}
                </h3>
                {isToday && (
                  <span className="text-[9px] font-[family-name:var(--font-jetbrains)] tracking-[0.12em] text-[#e63946] bg-[#e63946]/10 px-1.5 py-0.5 rounded">
                    {t("timeline.live")}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 ml-2">
                {Object.entries(counts).map(([sev, count]) => (
                  <div key={sev} className="flex items-center gap-0.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: SEVERITY_COLORS[sev] || "#6b7280",
                        boxShadow: `0 0 3px ${SEVERITY_COLORS[sev] || "#6b7280"}44`,
                      }}
                    />
                    <span className="text-[10px] text-gray-600 font-[family-name:var(--font-jetbrains)]">
                      {count}
                    </span>
                  </div>
                ))}
              </div>

              <span className="text-[10px] sm:text-[11px] text-gray-700 font-[family-name:var(--font-jetbrains)] ml-auto">
                {day.events.length} {t("timeline.events")}
              </span>

              <span
                className={`text-gray-600 text-[10px] transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              >
                {"\u25B6"}
              </span>
            </button>

            {isExpanded && (
              <div className="ml-3 border-l border-white/[0.06] pl-3 sm:pl-5 space-y-1.5 sm:space-y-2">
                {day.events.map((event) => (
                  <div
                    key={event.id}
                    className="event-card rounded-lg p-2.5 sm:p-3 bg-[#10131a] hover:bg-[#161a24] transition-colors"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <SeverityBadge severity={event.severity} />
                      <span className="text-[10px] sm:text-[11px] text-gray-600 capitalize">
                        {t(`cat.${event.category}`)}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-gray-700 font-[family-name:var(--font-jetbrains)] ml-auto">
                        {new Date(event.published_at).toLocaleTimeString(
                          "en-US",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    </div>
                    <h4 className="text-[12px] sm:text-[13px] font-medium text-gray-200 leading-snug">
                      {event.headline}
                    </h4>
                    {event.location_name && (
                      <span className="text-[9px] sm:text-[10px] text-gray-600 font-[family-name:var(--font-jetbrains)] mt-1 inline-block">
                        {event.location_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
