// THE MAP OF YABA. Everything here is plain data: roads, buildings, bus stops.
// x runs west → east, z runs north → south. One unit = one metre.

export const ROAD_HALF = 6; // roads are 12 m wide
export const SIDEWALK = 3;
export const ROAD_EXTENT = 112;

export interface Road {
  id: string;
  name: string;
  axis: "x" | "z"; // "z" = the road runs north–south at x = at
  at: number;
}

export const ROADS: Road[] = [
  { id: "akoka", name: "Akoka Road", axis: "z", at: -60 },
  { id: "herbert", name: "Herbert Macaulay Way", axis: "z", at: 10 },
  { id: "commercial", name: "Commercial Avenue", axis: "x", at: -55 },
  { id: "montgomery", name: "Montgomery Road", axis: "x", at: 35 },
];

export type Facing = "+x" | "-x" | "+z" | "-z";
export type BuildingStyle = "shop" | "office" | "house" | "glass" | "market" | "church";

export interface BuildingDef {
  id: string;
  x: number;
  z: number;
  w: number; // size along x
  d: number; // size along z
  h: number;
  color: string;
  style: BuildingStyle;
  facing: Facing; // which side the front door is on
  sign?: { text: string; bg: string; fg: string };
  place?: string; // the place you enter through this door (see places.ts)
  gen?: boolean; // has its own generator: windows stay lit when NEPA takes light
}

export const BUILDINGS: BuildingDef[] = [
  // ---- West side of Herbert Macaulay Way ----
  { id: "hub", x: -9, z: -20, w: 18, d: 20, h: 15, color: "#3E5A6B", style: "glass", facing: "+x", sign: { text: "SABO TECH HUB", bg: "#101418", fg: "#7CF2C2" }, place: "hub", gen: true },
  { id: "buka", x: -5, z: 6, w: 10, d: 10, h: 4.5, color: "#E8B796", style: "shop", facing: "+x", sign: { text: "MAMA NKECHI'S BUKA", bg: "#B5371F", fg: "#FFF3D6" }, place: "buka", gen: true },
  { id: "bank", x: -8, z: 60, w: 16, d: 14, h: 12, color: "#EEE9DF", style: "office", facing: "+x", sign: { text: "NAIJA TRUST BANK", bg: "#0B5D3B", fg: "#FFFFFF" }, place: "bank", gen: true },
  { id: "church", x: -9, z: 86, w: 18, d: 18, h: 11, color: "#E9DDC4", style: "church", facing: "+x", sign: { text: "GRACE ASSEMBLY", bg: "#2B2A6B", fg: "#F5D27A" }, place: "church" },
  // ---- East side of Herbert Macaulay Way ----
  { id: "mart", x: 29, z: -22, w: 18, d: 18, h: 8, color: "#BFD8B8", style: "shop", facing: "-x", sign: { text: "YABA MART", bg: "#D7261E", fg: "#FFFFFF" }, place: "mart", gen: true },
  { id: "crunchy", x: 27, z: 8, w: 14, d: 12, h: 7, color: "#F2E3C7", style: "shop", facing: "-x", sign: { text: "CRUNCHY REPUBLIC", bg: "#F5B700", fg: "#2A1600" }, place: "crunchy", gen: true },
  { id: "gadget", x: 28, z: 58, w: 16, d: 14, h: 10, color: "#A9C7D9", style: "shop", facing: "-x", sign: { text: "GADGET PLAZA", bg: "#1A1A2E", fg: "#5EE6FF" }, place: "gadget" },
  { id: "clinic", x: 28, z: 84, w: 16, d: 14, h: 9, color: "#EEF2F0", style: "office", facing: "-x", sign: { text: "ST. MERCY CLINIC", bg: "#FFFFFF", fg: "#C8102E" }, place: "clinic", gen: true },
  // ---- West side of Akoka Road ----
  { id: "uni", x: -86, z: -22, w: 32, d: 30, h: 12, color: "#D9C9A3", style: "office", facing: "+x", sign: { text: "AKOKA UNIVERSITY", bg: "#4A2C17", fg: "#F5D27A" }, place: "uni", gen: true },
  { id: "hostel", x: -82, z: 10, w: 24, d: 14, h: 10, color: "#E7B3B8", style: "house", facing: "+x", sign: { text: "AKOKA HOSTEL", bg: "#5B2333", fg: "#FFFFFF" }, place: "home_hostel" },
  // ---- East side of Akoka Road ----
  { id: "room", x: -42, z: -22, w: 16, d: 14, h: 7, color: "#E9DD8A", style: "house", facing: "-x", sign: { text: "NO. 14 ALAGOMEJI", bg: "#2B2B2B", fg: "#FFFFFF" }, place: "home_room" },
  { id: "uncle", x: -42, z: 8, w: 16, d: 12, h: 9, color: "#BFD8B8", style: "house", facing: "-x", sign: { text: "NO. 3 ADEOLA CLOSE", bg: "#2B2B2B", fg: "#FFFFFF" }, place: "home_uncle" },
  { id: "alhaji", x: -43, z: 58, w: 14, d: 12, h: 6, color: "#EEE9DF", style: "office", facing: "-x", sign: { text: "ALHAJI PROPERTIES", bg: "#0B5D3B", fg: "#F5D27A" }, place: "alhaji" },
  { id: "goalzone", x: -42, z: 82, w: 16, d: 14, h: 6, color: "#3D3D57", style: "shop", facing: "-x", sign: { text: "GOAL ZONE VIEWING CENTRE", bg: "#111111", fg: "#F5B700" }, place: "goalzone", gen: true },
  // ---- North of Commercial Avenue ----
  { id: "market", x: -28, z: -82, w: 30, d: 32, h: 6, color: "#C9653A", style: "market", facing: "+z", sign: { text: "YABA MARKET", bg: "#F5B700", fg: "#1E1E1E" }, place: "market" },
  { id: "barber", x: -6, z: -71, w: 10, d: 10, h: 5, color: "#A9C7D9", style: "shop", facing: "+z", sign: { text: "FRESH CUTZ", bg: "#1E1E1E", fg: "#FFFFFF" }, place: "barber", gen: true },
  { id: "selfcon", x: 42, z: -79, w: 20, d: 26, h: 16, color: "#EEE9DF", style: "house", facing: "+z", sign: { text: "SABO COURT", bg: "#3A3A3A", fg: "#F5D27A" }, place: "home_selfcon" },

  // ---- Neighbours' houses and offices (scenery: no sign, not enterable) ----
  { id: "f1", x: 62, z: -22, w: 16, d: 18, h: 12, color: "#E8B796", style: "house", facing: "-x" },
  { id: "f2", x: 86, z: -20, w: 16, d: 16, h: 9, color: "#D6E2C8", style: "house", facing: "-x" },
  { id: "f3", x: 60, z: 10, w: 14, d: 14, h: 7, color: "#E7B3B8", style: "house", facing: "-x" },
  { id: "f4", x: 85, z: 8, w: 18, d: 12, h: 14, color: "#C7CCD1", style: "office", facing: "-x" },
  { id: "f5", x: 60, z: 58, w: 16, d: 14, h: 10, color: "#E9DD8A", style: "house", facing: "-z" },
  { id: "f6", x: 86, z: 60, w: 14, d: 16, h: 6, color: "#BFD8B8", style: "house", facing: "-z" },
  { id: "f7", x: 60, z: 86, w: 16, d: 14, h: 8, color: "#A9C7D9", style: "house", facing: "-x" },
  { id: "f8", x: 86, z: 86, w: 14, d: 14, h: 12, color: "#EEE9DF", style: "office", facing: "-x" },
  { id: "f9", x: 72, z: -82, w: 18, d: 20, h: 10, color: "#E9DDC4", style: "house", facing: "+z" },
  { id: "f10", x: 94, z: -80, w: 12, d: 18, h: 7, color: "#E8B796", style: "house", facing: "+z" },
  { id: "f11", x: -86, z: -84, w: 26, d: 20, h: 8, color: "#D6E2C8", style: "house", facing: "+z" },
  { id: "f12", x: 25, z: -80, w: 10, d: 18, h: 9, color: "#E7B3B8", style: "house", facing: "+z" },
  { id: "f13", x: -26, z: -20, w: 12, d: 12, h: 6, color: "#E9DD8A", style: "house", facing: "+x" },
  { id: "f14", x: -26, z: 8, w: 10, d: 10, h: 5, color: "#A9C7D9", style: "house", facing: "+x" },
  { id: "f15", x: -26, z: 60, w: 10, d: 12, h: 7, color: "#E8B796", style: "house", facing: "+x" },
  { id: "f16", x: -26, z: 86, w: 12, d: 12, h: 5, color: "#BFD8B8", style: "house", facing: "+x" },
];

/** Where you stand to use a building's front door. */
export function doorPoint(b: BuildingDef): { x: number; z: number } {
  switch (b.facing) {
    case "+x": return { x: b.x + b.w / 2 + 1.5, z: b.z };
    case "-x": return { x: b.x - b.w / 2 - 1.5, z: b.z };
    case "+z": return { x: b.x, z: b.z + b.d / 2 + 1.5 };
    case "-z": return { x: b.x, z: b.z - b.d / 2 - 1.5 };
  }
}

export interface StopDef {
  id: string;
  name: string;
  x: number;
  z: number;
  facing: Facing; // which way the shelter opens
}

/** Danfo bus stops. Keke is also available from every stop. */
export const STOPS: StopDef[] = [
  { id: "yaba", name: "Yaba Bus Stop", x: 17.6, z: -2, facing: "-x" },
  { id: "akoka", name: "Akoka Bus Stop", x: -52.4, z: -40, facing: "-x" },
  { id: "sabo", name: "Sabo Bus Stop", x: 26, z: -62.6, facing: "+z" },
  { id: "montgomery", name: "Montgomery Bus Stop", x: -25, z: 42.6, facing: "-z" },
];

/** The football field next to Akoka Road. */
export const PITCH = { minX: -98, maxX: -72, minZ: 50, maxZ: 92 };

/** Mallam Musa's suya stall (only busy at night). */
export const SUYA_STALL = { x: 23.6, z: -41, w: 2.4, d: 3 };

/** Road segments split around the crossings, so kerbs and sidewalks stop at junctions. */
export function roadSegments(road: Road, gap: number): [number, number][] {
  const crossings = ROADS.filter((r) => r.axis !== road.axis).map((r) => r.at).sort((a, b) => a - b);
  const segs: [number, number][] = [];
  let start = -ROAD_EXTENT;
  for (const c of crossings) {
    segs.push([start, c - gap]);
    start = c + gap;
  }
  segs.push([start, ROAD_EXTENT]);
  return segs;
}
