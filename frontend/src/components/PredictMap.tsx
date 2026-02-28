"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Rectangle,
  CircleMarker,
  Polygon,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type {
  PredictionCell,
  GeoEventsResponse,
} from "@/types/events";
import { getPredictions, submitPrediction, getGeoEvents } from "@/lib/api";
import { CONFLICT_ZONES } from "@/lib/conflictZones";
import { useI18n } from "@/lib/i18n";

const IRAN_CENTER: [number, number] = [32.4279, 53.688];
const DEFAULT_ZOOM = 6;

function getCellColor(count: number, max: number): string {
  const ratio = max > 0 ? count / max : 0;
  if (ratio > 0.75) return "#7c3aed"; // purple-600
  if (ratio > 0.5) return "#8b5cf6";  // purple-500
  if (ratio > 0.25) return "#a78bfa"; // purple-400
  return "#c4b5fd";                    // purple-300
}

function getCellOpacity(count: number, max: number): number {
  const ratio = max > 0 ? count / max : 0;
  return 0.15 + ratio * 0.5;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function PredictMap() {
  const { t } = useI18n();
  const [cells, setCells] = useState<PredictionCell[]>([]);
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [geoData, setGeoData] = useState<GeoEventsResponse | null>(null);
  const [userPick, setUserPick] = useState<{ lat: number; lng: number; cellCount: number } | null>(null);
  const [pendingPick, setPendingPick] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxCount = cells.reduce((m, c) => Math.max(m, c.count), 0);

  const fetchPredictions = useCallback(async () => {
    try {
      const data = await getPredictions();
      setCells(data.cells);
      setTotalPredictions(data.total);
    } catch (err) {
      console.error("Failed to load predictions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGeoEvents = useCallback(async () => {
    try {
      const data = await getGeoEvents({ severity: "critical" });
      setGeoData(data);
    } catch (err) {
      console.error("Failed to load geo events", err);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
    fetchGeoEvents();
  }, [fetchPredictions, fetchGeoEvents]);

  const handleMapClick = (lat: number, lng: number) => {
    setError(null);
    setPendingPick({ lat, lng });
  };

  const handleConfirm = async () => {
    if (!pendingPick) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitPrediction(pendingPick.lat, pendingPick.lng);
      setUserPick({ lat: pendingPick.lat, lng: pendingPick.lng, cellCount: result.cell_count });
      setPendingPick(null);
      fetchPredictions();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("429")) {
        setError(t("predict.tooMany"));
      } else {
        console.error("Failed to submit prediction", err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPendingPick(null);
  };

  const recentFeatures = geoData?.features || [];

  return (
    <div className="predict-crosshair relative w-full h-full">
      {/* Instruction banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-[#10131a]/92 border border-purple-500/30 text-purple-300 px-4 sm:px-6 py-2 rounded-lg text-[11px] sm:text-[13px] backdrop-blur-sm font-[family-name:var(--font-jetbrains)] tracking-wide">
        <span className="mr-2">&#9678;</span>
        {t("predict.instruction")}
      </div>

      {/* Confirm/Cancel bar */}
      {pendingPick && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-[#10131a]/95 border border-purple-500/40 rounded-lg px-4 py-2.5 backdrop-blur-sm flex items-center gap-3">
          <span className="text-[11px] sm:text-[12px] text-purple-300 font-[family-name:var(--font-jetbrains)] tracking-wide">
            {t("predict.confirmQuestion")}
          </span>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] sm:text-[12px] font-[family-name:var(--font-jetbrains)] tracking-wide transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? "..." : t("predict.confirm")}
          </button>
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="px-3 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 text-[11px] sm:text-[12px] font-[family-name:var(--font-jetbrains)] tracking-wide transition-colors cursor-pointer"
          >
            {t("predict.cancel")}
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[1000] bg-red-950/80 border border-red-800/40 text-red-300 px-4 py-2 rounded-lg text-[13px] backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#0a0c10]/60 backdrop-blur-[2px]">
          <div className="flex items-center gap-2.5">
            <div className="status-dot" />
            <span className="text-[12px] sm:text-[13px] text-gray-400 font-[family-name:var(--font-jetbrains)] tracking-wide">
              {t("predict.loading")}
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="map-legend absolute bottom-6 right-4 z-[1000] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 min-w-[140px] sm:min-w-[160px] hidden sm:block">
        <div className="text-[10px] text-gray-500 font-[family-name:var(--font-jetbrains)] tracking-[0.1em] mb-2.5 uppercase">
          {t("predict.legend")}
        </div>
        <div className="space-y-1.5">
          {[
            { color: "#7c3aed", label: "predict.hot" },
            { color: "#8b5cf6", label: "predict.warm" },
            { color: "#a78bfa", label: "predict.moderate" },
            { color: "#c4b5fd", label: "predict.cool" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-4 h-3 rounded-sm"
                style={{ background: item.color, opacity: 0.7 }}
              />
              <span className="text-[11px] text-gray-400">{t(item.label)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-dashed border-red-500/60" />
            <span className="text-[11px] text-gray-400">{t("predict.dangerZone")}</span>
          </div>
        </div>
        {totalPredictions > 0 && (
          <div className="mt-2 pt-2 border-t border-white/[0.06] text-[10px] text-gray-600 font-[family-name:var(--font-jetbrains)]">
            {totalPredictions} {t("predict.totalPredictions")}
          </div>
        )}
      </div>

      <MapContainer
        center={IRAN_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        style={{ background: "#0a0c10" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <ClickHandler onMapClick={handleMapClick} />

        {/* Prediction grid cells */}
        {cells.map((cell) => (
          <Rectangle
            key={`${cell.grid_lat}-${cell.grid_lng}`}
            bounds={[
              [cell.grid_lat, cell.grid_lng],
              [cell.grid_lat + 0.5, cell.grid_lng + 0.5],
            ]}
            pathOptions={{
              color: getCellColor(cell.count, maxCount),
              weight: 1,
              fillColor: getCellColor(cell.count, maxCount),
              fillOpacity: getCellOpacity(cell.count, maxCount),
            }}
          >
            <Tooltip sticky className="zone-tooltip">
              <span>{t("predict.cellCount", { count: cell.count })}</span>
            </Tooltip>
          </Rectangle>
        ))}

        {/* Conflict zones — red dashed "ACTIVE DANGER" */}
        {CONFLICT_ZONES.map((zone) => (
          <Polygon
            key={zone.name}
            positions={zone.positions}
            pathOptions={{
              color: "#e63946",
              weight: 1.5,
              dashArray: "6 4",
              fillColor: "#e63946",
              fillOpacity: 0.06,
            }}
          >
            <Tooltip sticky className="zone-tooltip" direction="center">
              <span>{t("predict.activeDanger")} — {zone.name}</span>
            </Tooltip>
          </Polygon>
        ))}

        {/* Recent critical events as small red dots for context */}
        {recentFeatures.map((feature) => (
          <CircleMarker
            key={feature.properties.id}
            center={[
              feature.geometry.coordinates[1],
              feature.geometry.coordinates[0],
            ]}
            radius={4}
            pathOptions={{
              color: "#e63946",
              fillColor: "#e63946",
              fillOpacity: 0.6,
              weight: 1,
            }}
          >
            <Tooltip className="zone-tooltip">
              <span>{feature.properties.headline}</span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Pending pick — pulsing marker before confirm */}
        {pendingPick && (
          <CircleMarker
            center={[pendingPick.lat, pendingPick.lng]}
            radius={8}
            pathOptions={{
              color: "#c084fc",
              fillColor: "#a855f7",
              fillOpacity: 0.5,
              weight: 2,
              dashArray: "4 4",
            }}
          >
            <Tooltip permanent direction="top" className="zone-tooltip">
              <span>{t("predict.tapToConfirm")}</span>
            </Tooltip>
          </CircleMarker>
        )}

        {/* Confirmed user pick */}
        {userPick && (
          <CircleMarker
            center={[userPick.lat, userPick.lng]}
            radius={8}
            pathOptions={{
              color: "#a855f7",
              fillColor: "#7c3aed",
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Tooltip permanent direction="top" className="zone-tooltip">
              <span>
                {t("predict.yourPick")} — {userPick.cellCount} {t("predict.predictions")}
              </span>
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
