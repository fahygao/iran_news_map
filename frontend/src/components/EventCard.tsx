"use client";

import type { NewsEvent } from "@/types/events";
import { useI18n } from "@/lib/i18n";
import SeverityBadge from "./SeverityBadge";

interface EventCardProps {
  event: NewsEvent;
  count?: number;
  isSelected?: boolean;
  onHover?: (id: string | null) => void;
  onClick?: (id: string) => void;
}

export default function EventCard({
  event,
  count = 1,
  isSelected,
  onHover,
  onClick,
}: EventCardProps) {
  const { t, locale } = useI18n();
  const timeAgo = getTimeAgo(event.published_at);
  const headline = (locale === "zh" && event.headline_zh) ? event.headline_zh : event.headline;
  const summary = (locale === "zh" && event.summary_zh) ? event.summary_zh : event.summary;

  return (
    <article
      className={`event-card p-2.5 sm:p-3.5 cursor-pointer ${
        isSelected ? "event-card-selected" : ""
      }`}
      onMouseEnter={() => onHover?.(event.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(event.id)}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
        <SeverityBadge severity={event.severity} />
        <span className="text-[10px] sm:text-[11px] text-gray-600 capitalize">
          {t(`cat.${event.category}`)}
        </span>
        <span className="text-[10px] sm:text-[11px] text-gray-700 ml-auto font-[family-name:var(--font-jetbrains)]">
          {timeAgo}
        </span>
      </div>
      <h3 className="text-[12px] sm:text-[13px] font-medium leading-snug mb-0.5 sm:mb-1 text-gray-200">
        {headline}
      </h3>
      {summary && (
        <p className="text-[11px] sm:text-[12px] text-gray-500 line-clamp-2 mb-1 sm:mb-1.5 leading-relaxed hidden sm:block">
          {summary}
        </p>
      )}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-gray-600">
        <span>
          {event.source_name}
          {count > 1 && (
            <span className="ml-1.5 text-[9px] sm:text-[10px] text-gray-500 bg-white/[0.06] px-1 py-0.5 rounded font-[family-name:var(--font-jetbrains)]">
              &times;{count} {t("news.sources")}
            </span>
          )}
        </span>
        {event.location_name && (
          <span className="font-[family-name:var(--font-jetbrains)] text-[9px] sm:text-[10px] text-gray-600">
            {event.location_name}
          </span>
        )}
      </div>
      <a
        href={event.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] sm:text-[11px] text-[#e63946]/60 hover:text-[#e63946] mt-1 sm:mt-1.5 inline-block transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {t("news.readSource")} &rarr;
      </a>
    </article>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
