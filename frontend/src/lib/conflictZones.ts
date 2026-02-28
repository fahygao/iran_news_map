export interface ConflictZone {
  name: string;
  color: string;
  positions: [number, number][];
}

export const CONFLICT_ZONES: ConflictZone[] = [
  {
    name: "Strait of Hormuz - Naval Tension Zone",
    color: "#a855f7", // purple
    positions: [
      [26.0, 56.0],
      [26.0, 57.0],
      [27.0, 57.5],
      [27.5, 56.5],
      [27.0, 55.5],
      [26.5, 55.5],
    ],
  },
  {
    name: "Iran-Iraq Border - Historical Conflict Zone",
    color: "#f97316", // orange
    positions: [
      [30.0, 45.5],
      [30.0, 47.0],
      [32.0, 47.5],
      [34.0, 46.5],
      [36.0, 45.5],
      [36.0, 44.0],
      [34.0, 44.5],
      [32.0, 45.0],
    ],
  },
  {
    name: "Persian Gulf - Military Presence Zone",
    color: "#3b82f6", // blue
    positions: [
      [24.0, 50.0],
      [24.0, 54.0],
      [26.0, 56.0],
      [27.5, 56.5],
      [29.0, 51.0],
      [29.5, 49.0],
      [27.5, 49.5],
      [25.5, 50.0],
    ],
  },
  {
    name: "Northern Iran / Turkey Border - Kurdish Conflict Zone",
    color: "#eab308", // yellow
    positions: [
      [36.5, 43.5],
      [37.0, 44.5],
      [38.5, 45.0],
      [39.5, 44.5],
      [39.5, 43.0],
      [38.0, 43.0],
      [37.0, 43.0],
    ],
  },
];
