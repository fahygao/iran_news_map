"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Category, Severity } from "@/types/events";
import NewsList from "@/components/NewsList";
import Filters from "@/components/Filters";
import StatusBanner from "@/components/StatusBanner";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0c10] flex items-center justify-center">
      <div className="flex items-center gap-2.5">
        <div className="status-dot" />
        <span className="text-[12px] sm:text-[13px] text-gray-600 font-[family-name:var(--font-jetbrains)] tracking-wide">
          INITIALIZING...
        </span>
      </div>
    </div>
  ),
});

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category | undefined>();
  const [activeSeverity, setActiveSeverity] = useState<Severity | undefined>();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      <StatusBanner />
      <Filters
        activeCategory={activeCategory}
        activeSeverity={activeSeverity}
        onCategoryChange={setActiveCategory}
        onSeverityChange={setActiveSeverity}
      />
      {/* Desktop: side-by-side */}
      <div className="hidden md:flex flex-1 min-h-0">
        <div className="w-3/5 h-full">
          <Map
            category={activeCategory}
            severity={activeSeverity}
            selectedEventId={selectedEventId}
            onEventSelect={setSelectedEventId}
          />
        </div>
        <div className="w-2/5 h-full border-l border-white/[0.04]">
          <NewsList
            category={activeCategory}
            severity={activeSeverity}
            selectedEventId={selectedEventId}
            onEventSelect={setSelectedEventId}
          />
        </div>
      </div>
      {/* Mobile: stacked — map gets 55vh, news is compact */}
      <div className="flex md:hidden flex-col flex-1 min-h-0">
        <div className="h-[55vh] shrink-0">
          <Map
            category={activeCategory}
            severity={activeSeverity}
            selectedEventId={selectedEventId}
            onEventSelect={setSelectedEventId}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <NewsList
            category={activeCategory}
            severity={activeSeverity}
            selectedEventId={selectedEventId}
            onEventSelect={setSelectedEventId}
          />
        </div>
      </div>
    </div>
  );
}
