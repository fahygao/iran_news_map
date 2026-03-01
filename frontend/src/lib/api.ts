import type {
  EventsResponse,
  GeoEventsResponse,
  TimelineResponse,
  StatusResponse,
  PredictionsResponse,
  PredictionSubmitResponse,
  FlightsGeoResponse,
  Category,
  Severity,
} from "@/types/events";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function fetchAPI<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getEvents(options?: {
  category?: Category;
  severity?: Severity;
  since?: string;
  limit?: number;
  offset?: number;
}): Promise<EventsResponse> {
  const params: Record<string, string> = {};
  if (options?.category) params.category = options.category;
  if (options?.severity) params.severity = options.severity;
  if (options?.since) params.since = options.since;
  if (options?.limit) params.limit = String(options.limit);
  if (options?.offset) params.offset = String(options.offset);
  return fetchAPI<EventsResponse>("/events", params);
}

export async function getGeoEvents(options?: {
  category?: Category;
  severity?: Severity;
  since?: string;
}): Promise<GeoEventsResponse> {
  const params: Record<string, string> = {};
  if (options?.category) params.category = options.category;
  if (options?.severity) params.severity = options.severity;
  if (options?.since) params.since = options.since;
  return fetchAPI<GeoEventsResponse>("/events/geo", params);
}

export async function getTimelineEvents(options?: {
  days?: number;
  category?: Category;
  severity?: Severity;
}): Promise<TimelineResponse> {
  const params: Record<string, string> = {};
  if (options?.days) params.days = String(options.days);
  if (options?.category) params.category = options.category;
  if (options?.severity) params.severity = options.severity;
  return fetchAPI<TimelineResponse>("/events/timeline", params);
}

export async function getStatus(): Promise<StatusResponse> {
  return fetchAPI<StatusResponse>("/status");
}

export async function getPredictions(): Promise<PredictionsResponse> {
  return fetchAPI<PredictionsResponse>("/predictions");
}

export async function getFlights(): Promise<FlightsGeoResponse> {
  // Use Vercel API route directly (bypasses PythonAnywhere proxy issues)
  const res = await fetch("/api/flights/geo", { cache: "no-store" });
  if (!res.ok) throw new Error(`Flights API error: ${res.status}`);
  return res.json();
}

export async function submitPrediction(
  lat: number,
  lng: number
): Promise<PredictionSubmitResponse> {
  const url = `${API_URL}/predictions`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude: lat, longitude: lng }),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
