// INTERACTION: finds the closest thing you can use and builds the on-screen prompt.

import { INTERACT_RANGE, TALK_RANGE } from "../constants";
import { HOMES } from "../data/backgrounds";
import { BUILDINGS, STOPS, doorPoint } from "../data/map";
import { NPC_BY_ID } from "../data/npcs";
import { PLACES } from "../data/places";
import { runtime } from "../runtime";
import type { Sim } from "../types";
import { dist, hourLabel, isOpen } from "../utils";

export interface Prompt {
  key: string;
  kind: "place" | "npc" | "stop" | "ped";
  id: string;
  verb: string;
  label: string;
  sub?: string;
  enabled: boolean;
}

/** Where you stand to enter a place. */
export function placePoint(placeId: string): { x: number; z: number } {
  const p = PLACES[placeId];
  if (p?.spot) return { x: p.spot[0], z: p.spot[1] };
  const b = BUILDINGS.find((b) => b.place === placeId);
  return b ? doorPoint(b) : { x: 0, z: 0 };
}

export const PLACE_POINTS = Object.keys(PLACES).map((id) => ({ id, ...placePoint(id) }));

function placePrompt(s: Sim, id: string): Prompt {
  const p = PLACES[id];
  if (p.home) {
    if (s.home === p.home) return { key: `place:${id}`, kind: "place", id, verb: "GO HOME", label: HOMES[p.home].short, enabled: true };
    return {
      key: `place:${id}:locked`, kind: "place", id, verb: "", label: p.name, enabled: false,
      sub: p.home === "uncle" ? "Uncle Dayo's flat · you don't live here" : "Not your home · rent it at Alhaji Properties",
    };
  }
  const open = isOpen(p.hours, s.time);
  const verb = p.spot ? "VISIT" : "ENTER";
  if (!open && p.hours) {
    return { key: `place:${id}:closed`, kind: "place", id, verb, label: p.name, enabled: false, sub: `Closed · opens ${hourLabel(p.hours[0])}` };
  }
  return { key: `place:${id}`, kind: "place", id, verb, label: p.name, sub: p.kind, enabled: true };
}

export function findPrompt(s: Sim, x: number, z: number): Prompt | null {
  let best: Prompt | null = null;
  let bestD = Infinity;
  const consider = (d: number, range: number, make: () => Prompt) => {
    if (d <= range && d < bestD) {
      bestD = d;
      best = make();
    }
  };

  for (const pp of PLACE_POINTS) consider(dist(x, z, pp.x, pp.z), INTERACT_RANGE, () => placePrompt(s, pp.id));
  for (const st of STOPS) {
    consider(dist(x, z, st.x, st.z), INTERACT_RANGE, () => ({
      key: `stop:${st.id}`, kind: "stop", id: st.id, verb: "BOARD", label: st.name, sub: "Danfo ₦300 · Keke from ₦600 · cash", enabled: true,
    }));
  }
  for (const [id, n] of runtime.npcs) {
    if (!n.visible) continue;
    consider(dist(x, z, n.x, n.z) - 0.3, TALK_RANGE, () => ({
      key: `npc:${id}`, kind: "npc", id, verb: "TALK", label: NPC_BY_ID[id].name, sub: NPC_BY_ID[id].role, enabled: true,
    }));
  }
  for (const [id, p] of runtime.peds) {
    if (!p.visible) continue;
    consider(dist(x, z, p.x, p.z), TALK_RANGE * 0.8, () => ({
      key: `ped:${id}`, kind: "ped", id: String(id), verb: "TALK", label: p.name, enabled: true,
    }));
  }
  return best;
}
