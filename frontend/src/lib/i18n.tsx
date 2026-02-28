"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "en" | "zh";

const translations: Record<string, Record<Locale, string>> = {
  // Header
  "nav.map": { en: "MAP", zh: "地图" },
  "nav.timeline": { en: "TIMELINE", zh: "时间线" },

  // Filters
  "filter.category": { en: "Category", zh: "分类" },
  "filter.severity": { en: "Severity", zh: "严重度" },
  "filter.clear": { en: "CLEAR", zh: "清除" },
  "cat.conflict": { en: "Conflict", zh: "冲突" },
  "cat.military": { en: "Military", zh: "军事" },
  "cat.diplomatic": { en: "Diplomatic", zh: "外交" },
  "cat.political": { en: "Political", zh: "政治" },
  "cat.humanitarian": { en: "Humanitarian", zh: "人道" },
  "sev.critical": { en: "Critical", zh: "危急" },
  "sev.high": { en: "High", zh: "高" },
  "sev.medium": { en: "Medium", zh: "中" },
  "sev.low": { en: "Low", zh: "低" },

  // News list
  "news.title": { en: "Intel Feed", zh: "情报动态" },
  "news.noMatch": { en: "NO MATCHING EVENTS", zh: "无匹配事件" },
  "news.loadMore": { en: "LOAD MORE", zh: "加载更多" },
  "news.loading": { en: "LOADING...", zh: "加载中..." },
  "news.readSource": { en: "Read source", zh: "阅读原文" },

  // Map
  "map.hideZones": { en: "HIDE ZONES", zh: "隐藏区域" },
  "map.showZones": { en: "SHOW ZONES", zh: "显示区域" },
  "map.eventType": { en: "Event Type", zh: "事件类型" },
  "map.severity": { en: "Severity", zh: "严重度" },
  "map.eventsPlotted": { en: "events plotted", zh: "个事件" },
  "map.loadingIntel": { en: "LOADING INTEL...", zh: "加载情报中..." },
  "map.initializing": { en: "INITIALIZING...", zh: "初始化中..." },
  "map.noEvents": { en: "NO EVENTS MATCH CURRENT FILTERS", zh: "无匹配当前筛选的事件" },
  "map.rocket": { en: "Rocket / Missile", zh: "火箭 / 导弹" },
  "map.explosion": { en: "Explosion / Bombing", zh: "爆炸 / 轰炸" },
  "map.fire": { en: "Conflict / Battle", zh: "冲突 / 战斗" },
  "map.general": { en: "General Report", zh: "综合报道" },
  "map.origin": { en: "Origin", zh: "起源" },

  // Timeline
  "timeline.today": { en: "Today", zh: "今天" },
  "timeline.yesterday": { en: "Yesterday", zh: "昨天" },
  "timeline.daysAgo": { en: "days ago", zh: "天前" },
  "timeline.live": { en: "LIVE", zh: "实时" },
  "timeline.events": { en: "events", zh: "个事件" },
  "timeline.loading": { en: "LOADING TIMELINE...", zh: "加载时间线..." },
  "timeline.noEvents": { en: "NO EVENTS MATCH CURRENT FILTERS", zh: "无匹配当前筛选的事件" },

  // Status banner
  "status.stale": { en: "DATA MAY NOT BE CURRENT", zh: "数据可能不是最新" },
  "status.lastUpdated": { en: "last updated", zh: "上次更新" },
  "status.mAgo": { en: "m ago", zh: "分钟前" },
  "status.hAgo": { en: "h ago", zh: "小时前" },
  "status.dAgo": { en: "d ago", zh: "天前" },

  // Footer
  "footer.builtBy": { en: "Built by", zh: "开发者" },
  "footer.tipSolana": { en: "Tip (Solana)", zh: "打赏 (Solana)" },
  "footer.copied": { en: "Copied!", zh: "已复制!" },
  "footer.clickToCopy": { en: "Click to copy address", zh: "点击复制地址" },

  // Severity badges
  "badge.critical": { en: "CRITICAL", zh: "危急" },
  "badge.high": { en: "HIGH", zh: "高危" },
  "badge.medium": { en: "MED", zh: "中等" },
  "badge.low": { en: "LOW", zh: "低" },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("locale") as Locale) || "en";
    }
    return "en";
  });

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale);
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let text = translations[key]?.[locale] || translations[key]?.en || key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
