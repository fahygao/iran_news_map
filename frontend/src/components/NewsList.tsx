"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { NewsEvent, Category, Severity } from "@/types/events";
import { getEvents } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import EventCard from "./EventCard";

interface NewsListProps {
  category?: Category;
  severity?: Severity;
  selectedEventId?: string | null;
  onEventSelect?: (id: string | null) => void;
  onEventHover?: (id: string | null) => void;
}

export default function NewsList({
  category,
  severity,
  selectedEventId,
  onEventSelect,
  onEventHover,
}: NewsListProps) {
  const { t } = useI18n();
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchData = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const newOffset = reset ? 0 : offset;
      const data = await getEvents({ category, severity, limit, offset: newOffset });
      if (reset) {
        setEvents(data.events);
        setOffset(limit);
      } else {
        setEvents((prev) => [...prev, ...data.events]);
        setOffset((prev) => prev + limit);
      }
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load news:", err);
    } finally {
      setLoading(false);
    }
  }, [category, severity, offset]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setOffset(0);
    fetchData(true);
  }, [category, severity]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchData(true);
    }, 120_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [category, severity]);

  const hasMore = events.length < total;

  return (
    <div className="flex flex-col h-full bg-[#0a0c10]">
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-white/[0.04] flex items-center justify-between">
        <h2 className="text-[11px] sm:text-[12px] font-[family-name:var(--font-jetbrains)] tracking-[0.08em] text-gray-500 uppercase">
          {t("news.title")}
          <span className="ml-2 text-gray-700">
            {total}
          </span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 && !loading && (
          <div className="flex items-center justify-center h-32 text-gray-600 text-[12px] sm:text-[13px] font-[family-name:var(--font-jetbrains)]">
            {t("news.noMatch")}
          </div>
        )}
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isSelected={event.id === selectedEventId}
            onHover={onEventHover}
            onClick={onEventSelect}
          />
        ))}
        {hasMore && (
          <button
            onClick={() => fetchData(false)}
            disabled={loading}
            className="w-full py-2.5 sm:py-3 text-[11px] sm:text-[12px] text-gray-600 hover:text-gray-400 hover:bg-white/[0.02] transition-colors disabled:opacity-50 font-[family-name:var(--font-jetbrains)] tracking-wide cursor-pointer"
          >
            {loading ? t("news.loading") : t("news.loadMore")}
          </button>
        )}
        {loading && events.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2">
              <div className="status-dot" />
              <span className="text-[11px] sm:text-[12px] text-gray-600 font-[family-name:var(--font-jetbrains)] tracking-wide">
                {t("news.loading")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
