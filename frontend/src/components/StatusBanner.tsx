"use client";

import { useEffect, useState } from "react";
import { getStatus } from "@/lib/api";

export default function StatusBanner() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const status = await getStatus();
        setLastUpdated(status.last_updated);
        if (status.last_updated) {
          const lastTime = new Date(status.last_updated).getTime();
          const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
          setIsStale(lastTime < fourHoursAgo);
        }
      } catch {
        setIsStale(true);
      }
    }
    checkStatus();
    // Re-check every 2 minutes
    const id = setInterval(checkStatus, 120_000);
    return () => clearInterval(id);
  }, []);

  // Update "X min ago" every 30 seconds
  useEffect(() => {
    if (!lastUpdated) return;

    function update() {
      const diff = Date.now() - new Date(lastUpdated!).getTime();
      setMinutesAgo(Math.floor(diff / 60_000));
    }

    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  if (!isStale && minutesAgo !== null && minutesAgo < 60) return null;

  return (
    <div className="bg-[#c9a227]/[0.06] border-b border-[#c9a227]/20 text-[#c9a227]/70 text-[11px] px-5 py-1.5 font-[family-name:var(--font-jetbrains)] tracking-wide flex items-center justify-center gap-2">
      <span>DATA MAY NOT BE CURRENT</span>
      {minutesAgo !== null && (
        <span className="text-[#c9a227]/50">
          &mdash; last updated{" "}
          {minutesAgo < 60
            ? `${minutesAgo}m ago`
            : minutesAgo < 1440
              ? `${Math.floor(minutesAgo / 60)}h ago`
              : `${Math.floor(minutesAgo / 1440)}d ago`}
        </span>
      )}
    </div>
  );
}
