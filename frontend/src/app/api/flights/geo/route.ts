import { NextResponse } from "next/server";

const OPENSKY_URL = "https://opensky-network.org/api/states/all";
const BBOX = { lamin: 20, lomin: 30, lamax: 42, lomax: 65 };

let cache: { data: unknown; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 30_000; // 30 seconds

export async function GET() {
  const now = Date.now();

  if (cache.data && now - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  }

  try {
    const params = new URLSearchParams({
      lamin: String(BBOX.lamin),
      lomin: String(BBOX.lomin),
      lamax: String(BBOX.lamax),
      lomax: String(BBOX.lomax),
    });

    const res = await fetch(`${OPENSKY_URL}?${params}`, {
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      throw new Error(`OpenSky API error: ${res.status}`);
    }

    const data = await res.json();
    const states: unknown[][] = data.states || [];

    const features = states
      .filter((s) => !s[8] && s[6] != null && s[5] != null) // airborne with position
      .map((s) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [s[5], s[6]], // [lng, lat]
        },
        properties: {
          icao24: s[0],
          callsign: ((s[1] as string) || "").trim(),
          origin_country: s[2],
          altitude: s[7],
          velocity: s[9],
          heading: s[10],
        },
      }));

    const geojson = { type: "FeatureCollection", features };
    cache = { data: geojson, ts: now };

    return NextResponse.json(geojson, {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  } catch (e) {
    console.error("OpenSky fetch failed:", e);
    // Return cached data if available, otherwise empty
    if (cache.data) {
      return NextResponse.json(cache.data);
    }
    return NextResponse.json({ type: "FeatureCollection", features: [] });
  }
}
