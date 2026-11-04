// SAVE / LOAD. Saves live in the browser's localStorage, one key per slot.

import type { Sim } from "../types";

export const SLOTS = ["auto", "1", "2", "3"] as const;
export type Slot = (typeof SLOTS)[number];

export interface SaveMeta {
  slot: Slot;
  name: string;
  background: Sim["background"];
  time: number;
  cash: number;
  bank: number;
  savedAt: number;
}

const key = (slot: Slot) => `naijalife.save.${slot}`;

export function writeSave(slot: Slot, sim: Sim): boolean {
  try {
    localStorage.setItem(key(slot), JSON.stringify({ savedAt: Date.now(), sim }));
    return true;
  } catch {
    return false;
  }
}

function readRaw(slot: Slot): { savedAt: number; sim: Sim } | null {
  try {
    const raw = localStorage.getItem(key(slot));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.sim || data.sim.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function readSave(slot: Slot): Sim | null {
  return readRaw(slot)?.sim ?? null;
}

export function listSaves(): SaveMeta[] {
  const out: SaveMeta[] = [];
  for (const slot of SLOTS) {
    const r = readRaw(slot);
    if (r) out.push({ slot, name: r.sim.name, background: r.sim.background, time: r.sim.time, cash: r.sim.cash, bank: r.sim.bank, savedAt: r.savedAt });
  }
  return out;
}

export function latestSave(): SaveMeta | null {
  const all = listSaves();
  if (!all.length) return null;
  return all.reduce((a, b) => (b.savedAt > a.savedAt ? b : a));
}

export function deleteSave(slot: Slot) {
  try {
    localStorage.removeItem(key(slot));
  } catch {
    /* storage blocked */
  }
}
