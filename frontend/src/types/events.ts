export type MarkerType = "rocket" | "explosion" | "fire" | "default";

export interface NewsEvent {
  id: string;
  headline: string;
  summary: string | null;
  source_name: string;
  source_url: string;
  published_at: string;
  category: Category;
  severity: Severity;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  location_approximate: boolean;
  image_url: string | null;
  data_source: string;
  marker_type: MarkerType;
  origin_latitude: number | null;
  origin_longitude: number | null;
  origin_name: string | null;
}

export type Severity = "critical" | "high" | "medium" | "low";
export type Category =
  | "conflict"
  | "military"
  | "diplomatic"
  | "political"
  | "humanitarian";

export interface EventsResponse {
  events: NewsEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface GeoFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    id: string;
    headline: string;
    summary: string | null;
    source_name: string;
    source_url: string;
    published_at: string;
    category: Category;
    severity: Severity;
    location_name: string | null;
    image_url: string | null;
    marker_type: MarkerType;
    origin_latitude: number | null;
    origin_longitude: number | null;
    origin_name: string | null;
  };
}

export interface GeoEventsResponse {
  type: "FeatureCollection";
  features: GeoFeature[];
}

export interface TimelineDay {
  date: string;
  events: {
    id: string;
    headline: string;
    published_at: string;
    category: Category;
    severity: Severity;
    location_name: string | null;
  }[];
}

export interface TimelineResponse {
  timeline: TimelineDay[];
}

export interface SourceStatus {
  last_fetched: string | null;
  is_healthy: boolean;
  article_count: number;
}

export interface StatusResponse {
  status: string;
  last_updated: string | null;
  sources: Record<string, SourceStatus>;
  total_events: number;
  alerts_sent_today: number;
}
