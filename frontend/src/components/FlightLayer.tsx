"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { FlightFeature } from "@/types/events";
import { useI18n } from "@/lib/i18n";

interface TrackedFlight {
  marker: L.Marker;
  baseLat: number;
  baseLng: number;
  velocity: number; // m/s
  heading: number; // degrees
  baseTime: number; // ms timestamp
  feature: FlightFeature;
}

function createFlightIcon(heading: number) {
  return L.divIcon({
    className: "flight-marker",
    html: `<span style="
      font-size: 18px;
      display: block;
      line-height: 1;
      transform: rotate(${heading}deg);
      opacity: 0.6;
      filter: drop-shadow(0 0 4px #38bdf8);
      color: #38bdf8;
      transition: transform 0.5s linear;
    ">✈</span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}

function buildPopupHTML(
  f: FlightFeature,
  tFn: (key: string) => string
): string {
  const p = f.properties;
  const title = p.callsign || p.icao24;
  const altLine =
    p.altitude != null
      ? `<div style="color:#9ca3af">${tFn("flight.altitude")}: ${Math.round(p.altitude * 3.281).toLocaleString()} ft</div>`
      : "";
  const spdLine =
    p.velocity != null
      ? `<div style="color:#9ca3af">${tFn("flight.speed")}: ${Math.round(p.velocity * 3.6)} km/h</div>`
      : "";
  return `<div style="font-size:12px;font-family:var(--font-jetbrains),monospace;display:flex;flex-direction:column;gap:4px">
    <div style="font-size:13px;font-weight:700;color:#38bdf8">${title}</div>
    <div style="color:#9ca3af">${tFn("flight.country")}: ${p.origin_country}</div>
    ${altLine}${spdLine}
  </div>`;
}

/** Meters per degree latitude (roughly constant) */
const M_PER_DEG_LAT = 111_320;

function interpolate(
  baseLat: number,
  baseLng: number,
  velocity: number,
  headingDeg: number,
  dtSeconds: number
): [number, number] {
  const dist = velocity * dtSeconds; // meters traveled
  const headingRad = (headingDeg * Math.PI) / 180;
  const dLat = (dist * Math.cos(headingRad)) / M_PER_DEG_LAT;
  const dLng =
    (dist * Math.sin(headingRad)) /
    (M_PER_DEG_LAT * Math.cos((baseLat * Math.PI) / 180));
  return [baseLat + dLat, baseLng + dLng];
}

interface FlightLayerProps {
  flights: FlightFeature[];
  visible: boolean;
}

export default function FlightLayer({ flights, visible }: FlightLayerProps) {
  const map = useMap();
  const { t } = useI18n();
  const trackRef = useRef<Map<string, TrackedFlight>>(new Map());
  const rafRef = useRef<number>(0);

  const tRef = useRef(t);
  tRef.current = t;

  // Sync markers with incoming flight data
  useEffect(() => {
    const tracked = trackRef.current;
    const now = performance.now();

    if (!visible) {
      // Remove all markers
      tracked.forEach((tf) => tf.marker.remove());
      tracked.clear();
      return;
    }

    const incoming = new Set<string>();

    for (const f of flights) {
      const id = f.properties.icao24;
      incoming.add(id);
      const lat = f.geometry.coordinates[1];
      const lng = f.geometry.coordinates[0];
      const vel = f.properties.velocity ?? 0;
      const hdg = f.properties.heading ?? 0;

      const existing = tracked.get(id);
      if (existing) {
        // Update base position & properties, reset timer
        existing.baseLat = lat;
        existing.baseLng = lng;
        existing.velocity = vel;
        existing.heading = hdg;
        existing.baseTime = now;
        existing.feature = f;
        // Update icon rotation
        existing.marker.setIcon(createFlightIcon(hdg));
        existing.marker.setPopupContent(
          buildPopupHTML(f, tRef.current)
        );
      } else {
        // New flight — create marker
        const marker = L.marker([lat, lng], {
          icon: createFlightIcon(hdg),
          interactive: true,
        });
        marker.bindPopup(buildPopupHTML(f, tRef.current));
        marker.addTo(map);
        tracked.set(id, {
          marker,
          baseLat: lat,
          baseLng: lng,
          velocity: vel,
          heading: hdg,
          baseTime: now,
          feature: f,
        });
      }
    }

    // Remove stale flights
    for (const [id, tf] of tracked) {
      if (!incoming.has(id)) {
        tf.marker.remove();
        tracked.delete(id);
      }
    }
  }, [flights, visible, map]);

  // Animation loop
  const animate = useCallback(() => {
    const now = performance.now();
    trackRef.current.forEach((tf) => {
      if (tf.velocity < 1) return; // stationary, skip
      const dt = (now - tf.baseTime) / 1000; // seconds
      // Cap interpolation to 60s to avoid runaway drift
      const clampedDt = Math.min(dt, 60);
      const [lat, lng] = interpolate(
        tf.baseLat,
        tf.baseLng,
        tf.velocity,
        tf.heading,
        clampedDt
      );
      tf.marker.setLatLng([lat, lng]);
    });
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!visible) return;
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, animate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      trackRef.current.forEach((tf) => tf.marker.remove());
      trackRef.current.clear();
    };
  }, []);

  return null; // Renders via Leaflet API, not React DOM
}
