// Materials that light up at night. DayNight.tsx turns them up and down every frame.
import type * as THREE from "three";

export const glow = {
  windows: [] as { mat: THREE.MeshStandardMaterial; gen: boolean }[],
  lamps: [] as THREE.MeshStandardMaterial[],
};

export function registerWindows(mat: THREE.MeshStandardMaterial, gen: boolean) {
  const entry = { mat, gen };
  glow.windows.push(entry);
  return () => {
    glow.windows = glow.windows.filter((e) => e !== entry);
  };
}

export function registerLamp(mat: THREE.MeshStandardMaterial) {
  glow.lamps.push(mat);
  return () => {
    glow.lamps = glow.lamps.filter((m) => m !== mat);
  };
}
