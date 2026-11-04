// Draws the top-down map (used by the minimap and the phone's Map app).

import { HOMES } from "../game/data/backgrounds";
import { BUILDINGS, PITCH, ROAD_EXTENT, ROAD_HALF, ROADS, STOPS } from "../game/data/map";
import { runtime } from "../game/runtime";
import type { Sim } from "../game/types";

export interface MapView {
  cx: number;
  cz: number;
  scale: number; // pixels per metre
  labels: boolean;
}

export function drawMap(ctx: CanvasRenderingContext2D, w: number, h: number, view: MapView, sim: Sim | null) {
  const { cx, cz, scale } = view;
  const X = (x: number) => (x - cx) * scale + w / 2;
  const Z = (z: number) => (z - cz) * scale + h / 2;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#C2A97A";
  ctx.fillRect(0, 0, w, h);

  // Pitch
  ctx.fillStyle = "#5E9A48";
  ctx.fillRect(X(PITCH.minX), Z(PITCH.minZ), (PITCH.maxX - PITCH.minX) * scale, (PITCH.maxZ - PITCH.minZ) * scale);

  // Roads
  ctx.fillStyle = "#43434A";
  for (const r of ROADS) {
    if (r.axis === "z") ctx.fillRect(X(r.at - ROAD_HALF), Z(-ROAD_EXTENT), ROAD_HALF * 2 * scale, ROAD_EXTENT * 2 * scale);
    else ctx.fillRect(X(-ROAD_EXTENT), Z(r.at - ROAD_HALF), ROAD_EXTENT * 2 * scale, ROAD_HALF * 2 * scale);
  }

  // Buildings
  const homeBuilding = sim ? BUILDINGS.find((b) => b.place === HOMES[sim.home].place)?.id : null;
  for (const b of BUILDINGS) {
    const isHome = b.id === homeBuilding;
    ctx.fillStyle = isHome ? "#2FBF71" : b.place && !b.place.startsWith("home_") ? "#F2E6C9" : "#9C8B70";
    ctx.fillRect(X(b.x - b.w / 2), Z(b.z - b.d / 2), b.w * scale, b.d * scale);
    if (b.sign && view.labels && scale > 1.6) {
      ctx.fillStyle = "#1A1A1A";
      ctx.font = `700 ${Math.max(9, scale * 3.2)}px Figtree, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = isHome ? "HOME" : b.sign.text.replace("VIEWING CENTRE", "").replace("'S BUKA", "").trim();
      ctx.fillText(label, X(b.x), Z(b.z), b.w * scale + 30);
    }
  }

  // Bus stops
  for (const s of STOPS) {
    ctx.fillStyle = "#1F6FD1";
    ctx.beginPath();
    ctx.arc(X(s.x), Z(s.z), Math.max(3, scale * 1.4), 0, Math.PI * 2);
    ctx.fill();
  }

  // NPCs
  for (const [, n] of runtime.npcs) {
    if (!n.visible) continue;
    ctx.fillStyle = "#F5B700";
    ctx.beginPath();
    ctx.arc(X(n.x), Z(n.z), Math.max(2.5, scale * 0.9), 0, Math.PI * 2);
    ctx.fill();
  }

  // Waypoint
  if (sim?.waypoint) {
    ctx.strokeStyle = "#F5B700";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(X(sim.waypoint.x), Z(sim.waypoint.z), Math.max(6, scale * 2.5), 0, Math.PI * 2);
    ctx.stroke();
  }

  // Player arrow
  const p = runtime.player;
  ctx.save();
  ctx.translate(X(p.x), Z(p.z));
  ctx.rotate(-p.yaw + Math.PI);
  ctx.fillStyle = "#E5533D";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(6, 6);
  ctx.lineTo(0, 3);
  ctx.lineTo(-6, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
