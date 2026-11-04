// Where street lamps and trees go: along every sidewalk, skipping junctions and doorways.
import { BUILDINGS, ROAD_HALF, ROADS, STOPS, doorPoint } from "../game/data/map";

export interface Spot {
  x: number;
  z: number;
  armX: number;
  armZ: number;
}

const cache = new Map<string, Spot[]>();

export function streetSpots(step: number, offset: number, phase: number): Spot[] {
  const key = `${step}:${offset}:${phase}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const doors = BUILDINGS.map(doorPoint).concat(STOPS.map((s) => ({ x: s.x, z: s.z })));
  const out: Spot[] = [];
  for (const r of ROADS) {
    const crossings = ROADS.filter((o) => o.axis !== r.axis).map((o) => o.at);
    for (const side of [-1, 1]) {
      for (let t = -100 + phase; t <= 100; t += step) {
        if (crossings.some((c) => Math.abs(c - t) < 11)) continue;
        const across = side * (ROAD_HALF + offset);
        const x = r.axis === "z" ? r.at + across : t;
        const z = r.axis === "z" ? t : r.at + across;
        if (doors.some((d) => Math.hypot(d.x - x, d.z - z) < 3.2)) continue;
        out.push({ x, z, armX: r.axis === "z" ? -side : 0, armZ: r.axis === "x" ? -side : 0 });
      }
    }
  }
  cache.set(key, out);
  return out;
}

export const LAMP_SPOTS = () => streetSpots(22, 2.6, 0);
export const TREE_SPOTS = () => streetSpots(37, 2.0, 11);
