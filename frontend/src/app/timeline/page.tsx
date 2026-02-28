"use client";

import { useState } from "react";
import type { Category, Severity } from "@/types/events";
import Timeline from "@/components/Timeline";
import Filters from "@/components/Filters";

export default function TimelinePage() {
  const [activeCategory, setActiveCategory] = useState<Category | undefined>();
  const [activeSeverity, setActiveSeverity] = useState<Severity | undefined>();

  return (
    <div className="flex flex-col h-full">
      <Filters
        activeCategory={activeCategory}
        activeSeverity={activeSeverity}
        onCategoryChange={setActiveCategory}
        onSeverityChange={setActiveSeverity}
      />
      <div className="flex-1 overflow-y-auto">
        <Timeline
          category={activeCategory}
          severity={activeSeverity}
          days={7}
        />
      </div>
    </div>
  );
}
