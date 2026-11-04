// COLLISION: buildings are rectangles seen from above. The player is a circle.
// If the circle overlaps a rectangle, we push the circle out along the shortest way.

import { BUILDINGS, STOPS, SUYA_STALL } from "../data/map";
import { clamp } from "../utils";

export interface Box {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const boxAt = (x: number, z: number, w: number, d: number): Box => ({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });

/** The back wall of each bus-stop shelter. */
function shelterBack(s: (typeof STOPS)[number]): Box {
  switch (s.facing) {
    case "-x": return boxAt(s.x + 1.6, s.z, 0.3, 4);
    case "+x": return boxAt(s.x - 1.6, s.z, 0.3, 4);
    case "+z": return boxAt(s.x, s.z - 1.6, 4, 0.3);
    case "-z": return boxAt(s.x, s.z + 1.6, 4, 0.3);
  }
}

export const STATIC_BOXES: Box[] = [
  ...BUILDINGS.map((b) => boxAt(b.x, b.z, b.w, b.d)),
  boxAt(SUYA_STALL.x, SUYA_STALL.z, SUYA_STALL.w, SUYA_STALL.d),
  ...STOPS.map(shelterBack),
];

/** Pushes the point (p.x, p.z) with radius r out of every box. Changes p in place. */
export function collideCircle(p: { x: number; z: number }, r: number, boxes: Box[] = STATIC_BOXES) {
  for (const b of boxes) {
    if (p.x < b.minX - r || p.x > b.maxX + r || p.z < b.minZ - r || p.z > b.maxZ + r) continue;
    const cx = clamp(p.x, b.minX, b.maxX);
    const cz = clamp(p.z, b.minZ, b.maxZ);
    const dx = p.x - cx;
    const dz = p.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      p.x = cx + (dx / d) * r;
      p.z = cz + (dz / d) * r;
    } else {
      // Centre is inside the box: leave by the nearest side.
      const left = p.x - b.minX, right = b.maxX - p.x, top = p.z - b.minZ, bottom = b.maxZ - p.z;
      const m = Math.min(left, right, top, bottom);
      if (m === left) p.x = b.minX - r;
      else if (m === right) p.x = b.maxX + r;
      else if (m === top) p.z = b.minZ - r;
      else p.z = b.maxZ + r;
    }
  }
}
