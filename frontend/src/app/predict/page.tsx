"use client";

import dynamic from "next/dynamic";

const PredictMap = dynamic(() => import("@/components/PredictMap"), {
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

export default function PredictPage() {
  return (
    <div className="h-full">
      <PredictMap />
    </div>
  );
}
