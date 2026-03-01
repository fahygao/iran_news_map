"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useI18n } from "@/lib/i18n";
import countriesData from "@/lib/middleEastCountries.json";

interface CountryBordersLayerProps {
  visible: boolean;
}

export default function CountryBordersLayer({ visible }: CountryBordersLayerProps) {
  const map = useMap();
  const { locale } = useI18n();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Clean up previous layer
    if (layerRef.current) {
      layerRef.current.remove();
      layerRef.current = null;
    }

    if (!visible) return;

    const group = L.layerGroup();

    // Add country boundary polygons
    const geoLayer = L.geoJSON(countriesData as GeoJSON.FeatureCollection, {
      style: {
        color: "#ffffff",
        weight: 1.2,
        opacity: 0.25,
        fillColor: "transparent",
        fillOpacity: 0,
        dashArray: "4 3",
      },
      interactive: false,
    });
    group.addLayer(geoLayer);

    // Add country name labels at centroids
    for (const feature of countriesData.features) {
      const props = feature.properties;
      const [lat, lng] = props.center;
      const name = locale === "zh" ? props.name_zh : props.name_en;

      const label = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "country-label",
          html: `<span style="
            font-size: 11px;
            font-family: var(--font-jetbrains), monospace;
            color: rgba(255,255,255,0.35);
            text-shadow: 0 0 6px rgba(0,0,0,0.8);
            white-space: nowrap;
            letter-spacing: 0.15em;
            pointer-events: none;
            user-select: none;
          ">${name}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false,
      });
      group.addLayer(label);
    }

    group.addTo(map);
    layerRef.current = group;

    return () => {
      group.remove();
      layerRef.current = null;
    };
  }, [visible, locale, map]);

  return null;
}
