"use client";

import type { GeoFeature } from "@/types/events";
import { useI18n } from "@/lib/i18n";
import SeverityBadge from "./SeverityBadge";

export default function EventPopup({ feature }: { feature: GeoFeature }) {
  const { t } = useI18n();
  const p = feature.properties;

  return (
    <div className="min-w-[250px] max-w-[320px] text-gray-200">
      <div className="flex items-start gap-2 mb-2">
        <SeverityBadge severity={p.severity} />
        <span className="text-[11px] text-gray-500 capitalize">{t(`cat.${p.category}`)}</span>
      </div>
      <h3 className="font-semibold text-[13px] leading-tight mb-1.5 text-gray-100">
        {p.headline}
      </h3>
      {p.summary && (
        <p className="text-[12px] text-gray-500 mb-2 line-clamp-3 leading-relaxed">
          {p.summary}
        </p>
      )}
      <div className="flex items-center justify-between text-[11px] text-gray-600">
        <span>{p.source_name}</span>
        <span className="font-[family-name:var(--font-jetbrains)]">
          {new Date(p.published_at).toLocaleDateString()}
        </span>
      </div>
      {p.location_name && (
        <div className="text-[11px] text-gray-600 mt-1 font-[family-name:var(--font-jetbrains)]">
          {p.location_name}
        </div>
      )}
      <a
        href={p.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2 text-[11px] text-[#e63946]/60 hover:text-[#e63946] transition-colors"
      >
        {t("news.readSource")} &rarr;
      </a>
    </div>
  );
}
