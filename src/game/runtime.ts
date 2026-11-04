// LIVE DATA THAT CHANGES EVERY FRAME (60 times a second).
// It lives outside React on purpose: putting it in state would re-render the whole UI constantly.
// The 3D components write here; the HUD, minimap and store read from here.

export interface Mover {
  x: number;
  z: number;
  visible: boolean;
}

export interface PedRuntime extends Mover {
  name: string;
  line: string;
}

export interface VehicleRuntime {
  x: number;
  z: number;
  halfLong: number;
  halfWide: number;
  alongX: boolean;
  dir: number;
  speed: number;
  kind: "danfo" | "keke" | "car" | "okada";
}

export const runtime = {
  player: { x: 0, y: 0, z: 0, yaw: 0, running: false, moving: false },
  /** The smooth clock (game minutes). The saved Sim.time catches up a few times a second. */
  liveTime: 0,
  cameraYaw: 0,
  /** Set this to swing the camera to a new angle (e.g. after loading a save). */
  cameraYawRequest: null as number | null,
  snapCamera: false,
  teleport: null as null | { x: number; z: number },
  blockInputUntil: 0,
  npcs: new Map<string, Mover>(),
  peds: new Map<number, PedRuntime>(),
  vehicles: [] as VehicleRuntime[],
  talkingTo: null as string | null,
  lastAutosave: 0,
  runSeconds: 0,
};
