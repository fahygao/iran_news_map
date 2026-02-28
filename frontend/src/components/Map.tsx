"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  Tooltip,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type {
  GeoEventsResponse,
  GeoFeature,
  Severity,
  Category,
  MarkerType,
} from "@/types/events";
import { getGeoEvents } from "@/lib/api";
import { CONFLICT_ZONES } from "@/lib/conflictZones";
import EventPopup from "./EventPopup";

const IRAN_CENTER: [number, number] = [32.4279, 53.688];
const DEFAULT_ZOOM = 6;

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#e63946",
  high: "#e87d2f",
  medium: "#c9a227",
  low: "#3b82f6",
};

const MARKER_EMOJIS: Record<MarkerType, { emoji: string; size: number }> = {
  rocket: { emoji: "\u{1F680}", size: 28 },
  explosion: { emoji: "\u{1F4A5}", size: 28 },
  fire: { emoji: "\u{1F525}", size: 28 },
  default: { emoji: "\u{1F4F0}", size: 22 },
};

function createEmojiIcon(markerType: MarkerType, severity: Severity) {
  const { emoji, size } = MARKER_EMOJIS[markerType] || MARKER_EMOJIS.default;
  const glowColor = SEVERITY_COLORS[severity] || SEVERITY_COLORS.medium;
  return L.divIcon({
    className: "emoji-marker",
    html: `<span style="
      font-size: ${size}px;
      filter: drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 14px ${glowColor}66);
      cursor: pointer;
      line-height: 1;
      display: block;
    ">${emoji}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

interface MapProps {
  category?: Category;
  severity?: Severity;
  selectedEventId?: string | null;
  onEventSelect?: (id: string | null) => void;
}

export default function Map({
  category,
  severity,
  selectedEventId,
  onEventSelect,
}: MapProps) {
  const [geoData, setGeoData] = useState<GeoEventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showZones, setShowZones] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await getGeoEvents({ category, severity });
      setGeoData(data);
      setError(null);
    } catch (err) {
      setError("Failed to load map data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, severity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 2 minutes (silent, no loading spinner)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchData(false);
    }, 120_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const features = geoData?.features || [];

  // Deduplicated attack routes: only rocket/explosion, grouped by origin name
  const routeLines = (() => {
    const seen = new Set<string>();
    return features
      .filter(
        (f) =>
          f.properties.origin_latitude != null &&
          f.properties.origin_longitude != null &&
          (f.properties.marker_type === "rocket" ||
            f.properties.marker_type === "explosion")
      )
      .filter((f) => {
        // Deduplicate by rounding coords to ~10km grid
        const key = `${f.properties.origin_name}-${Math.round(f.geometry.coordinates[1])},${Math.round(f.geometry.coordinates[0])}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12)
      .map((f) => ({
        id: f.properties.id,
        from: [
          f.properties.origin_latitude!,
          f.properties.origin_longitude!,
        ] as [number, number],
        to: [
          f.geometry.coordinates[1],
          f.geometry.coordinates[0],
        ] as [number, number],
        originName: f.properties.origin_name,
        severity: f.properties.severity,
      }));
  })();

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#0a0c10]/60 backdrop-blur-[2px]">
          <div className="flex items-center gap-2.5">
            <div className="status-dot" />
            <span className="text-[13px] text-gray-400 font-[family-name:var(--font-jetbrains)] tracking-wide">
              LOADING INTEL...
            </span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-950/80 border border-red-800/40 text-red-300 px-4 py-2 rounded-lg text-[13px] backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Zone toggle */}
      <button
        onClick={() => setShowZones(!showZones)}
        className="zone-toggle absolute top-4 right-4 z-[1000] px-3 py-1.5 rounded text-[11px] font-[family-name:var(--font-jetbrains)] tracking-wider text-gray-400 hover:text-gray-200 cursor-pointer"
      >
        {showZones ? "HIDE ZONES" : "SHOW ZONES"}
      </button>

      {/* Legend */}
      <div className="map-legend absolute bottom-6 right-4 z-[1000] rounded-lg px-4 py-3 min-w-[160px]">
        <div className="text-[10px] text-gray-500 font-[family-name:var(--font-jetbrains)] tracking-[0.1em] mb-2.5 uppercase">
          Event Type
        </div>
        <div className="space-y-2">
          {[
            { emoji: "\u{1F680}", label: "Rocket / Missile" },
            { emoji: "\u{1F4A5}", label: "Explosion / Bombing" },
            { emoji: "\u{1F525}", label: "Conflict / Battle" },
            { emoji: "\u{1F4F0}", label: "General Report" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span className="text-[16px] w-5 text-center">{item.emoji}</span>
              <span className="text-[12px] text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
          <div className="text-[10px] text-gray-500 font-[family-name:var(--font-jetbrains)] tracking-[0.1em] mb-2 uppercase">
            Severity
          </div>
          <div className="flex gap-1.5">
            {[
              { color: "#e63946", label: "CRIT" },
              { color: "#e87d2f", label: "HIGH" },
              { color: "#c9a227", label: "MED" },
              { color: "#3b82f6", label: "LOW" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: s.color,
                    boxShadow: `0 0 4px ${s.color}66`,
                  }}
                />
                <span className="text-[10px] text-gray-500 font-[family-name:var(--font-jetbrains)]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        {!loading && features.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-white/[0.06] text-[10px] text-gray-600 font-[family-name:var(--font-jetbrains)]">
            {features.length} events plotted
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

        {/* Conflict zone overlays */}
        {showZones &&
          CONFLICT_ZONES.map((zone) => (
            <Polygon
              key={zone.name}
              positions={zone.positions}
              pathOptions={{
                color: zone.color,
                weight: 1.5,
                dashArray: "6 4",
                fillColor: zone.color,
                fillOpacity: 0.06,
              }}
            >
              <Tooltip
                sticky
                className="zone-tooltip"
                direction="center"
              >
                <span>{zone.name}</span>
              </Tooltip>
            </Polygon>
          ))}

        {/* Attack route lines */}
        {routeLines.map((route) => (
          <Polyline
            key={`route-${route.id}`}
            positions={[route.from, route.to]}
            pathOptions={{
              color:
                route.severity === "critical" || route.severity === "high"
                  ? "#e63946"
                  : "#e87d2f",
              weight: 1.5,
              dashArray: "4 6",
              opacity: 0.4,
            }}
          >
            <Tooltip sticky className="zone-tooltip">
              <span>Origin: {route.originName || "Unknown"}</span>
            </Tooltip>
          </Polyline>
        ))}

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={25}
          spiderfyOnMaxZoom
          disableClusteringAtZoom={9}
          spiderfyDistanceMultiplier={2}
          showCoverageOnHover={false}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          iconCreateFunction={(cluster: any) => {
            const count = cluster.getChildCount();
            let dim = 28;
            let bg = "#3b82f6";
            if (count > 50) {
              dim = 42;
              bg = "#e63946";
            } else if (count > 10) {
              dim = 34;
              bg = "#e87d2f";
            }
            return L.divIcon({
              html: `<div style="
                background: ${bg};
                color: white;
                width: ${dim}px;
                height: ${dim}px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 600;
                font-family: var(--font-jetbrains), monospace;
                border: 1.5px solid rgba(255,255,255,0.25);
                box-shadow: 0 0 10px ${bg}55, 0 2px 8px rgba(0,0,0,0.3);
              ">${count}</div>`,
              className: "custom-cluster",
              iconSize: L.point(dim, dim),
            });
          }}
        >
          {features.map((feature: GeoFeature) => (
            <Marker
              key={feature.properties.id}
              position={[
                feature.geometry.coordinates[1],
                feature.geometry.coordinates[0],
              ]}
              icon={createEmojiIcon(
                feature.properties.marker_type || "default",
                feature.properties.severity
              )}
              eventHandlers={{
                click: () => onEventSelect?.(feature.properties.id),
              }}
            >
              <Popup className="dark-popup">
                <EventPopup feature={feature} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {!loading && features.length === 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-[#10131a]/90 border border-white/[0.06] text-gray-500 px-4 py-2 rounded-lg text-[13px] backdrop-blur-sm font-[family-name:var(--font-jetbrains)]">
          NO EVENTS MATCH CURRENT FILTERS
        </div>
      )}
    </div>
  );
}
