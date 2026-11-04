// DAY AND NIGHT: the sun moves with the game clock, the sky changes colour,
// street lamps switch on at dusk, and windows light up only where there's power (NEPA or a generator).

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { runtime } from "../game/runtime";
import { useGame } from "../game/store";
import { clamp, hourOf } from "../game/utils";
import { glow } from "./glow";
import { LAMP_SPOTS } from "./placements";

const LAMP_LIGHTS = 5;

const NIGHT = new THREE.Color("#0C1430");
const DUSK = new THREE.Color("#E58E5A");
const DAY = new THREE.Color("#9CCBE8");

export function DayNight({ shadows, quality }: { shadows: boolean; quality: "low" | "high" }) {
  const { scene } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const target = useMemo(() => new THREE.Object3D(), []);
  const sky = useMemo(() => new THREE.Color(), []);
  const lampLights = useRef<(THREE.PointLight | null)[]>([]);

  useEffect(() => {
    scene.add(target);
    sun.current.target = target;
    scene.fog = new THREE.Fog("#9CCBE8", 70, 190);
    return () => {
      scene.remove(target);
      scene.fog = null;
    };
  }, [scene, target]);

  useFrame(() => {
    const h = hourOf(runtime.liveTime);
    const angle = ((h - 6) / 12) * Math.PI;
    const elev = Math.sin(angle); // 1 at noon, below 0 at night
    const day = clamp(elev * 2.2 + 0.1, 0, 1);
    const night = 1 - clamp((elev + 0.08) * 4, 0, 1);
    const duskAmt = clamp(1 - Math.abs(elev) * 4, 0, 1);

    sky.copy(NIGHT).lerp(DAY, day).lerp(DUSK, duskAmt * 0.55);
    scene.background = sky;
    (scene.fog as THREE.Fog).color.copy(sky);

    const p = runtime.player;
    const dir = new THREE.Vector3(Math.cos(angle) * 0.7, Math.max(0.25, Math.abs(elev)), 0.45).normalize();
    sun.current.position.set(p.x + dir.x * 60, dir.y * 60, p.z + dir.z * 60);
    target.position.set(p.x, 0, p.z);
    sun.current.intensity = elev > 0 ? 0.3 + elev * 2.3 : 0.55;
    sun.current.color.set(elev > 0 ? (elev < 0.3 ? "#FFC48A" : "#FFF4E2") : "#9FB2FF");
    hemi.current.intensity = 0.8 + day * 0.3;
    hemi.current.color.set(elev > 0 ? "#DDEBFF" : "#7484C4");

    // Real light pools under the street lamps nearest to you.
    const near = LAMP_SPOTS()
      .map((l) => ({ l, d: (l.x - p.x) ** 2 + (l.z - p.z) ** 2 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, LAMP_LIGHTS);
    near.forEach(({ l }, i) => {
      const pl = lampLights.current[i];
      if (!pl) return;
      pl.position.set(l.x + l.armX * 0.8, 5.4, l.z + l.armZ * 0.8);
      pl.intensity = night * 60;
    });

    const sim = useGame.getState().sim;
    const nepa = sim?.nepa ?? true;
    for (const w of glow.windows) w.mat.emissiveIntensity = night * (nepa || w.gen ? 1.15 : 0);
    for (const m of glow.lamps) m.emissiveIntensity = night * 2.4;
  });

  const size = quality === "high" ? 2048 : 1024;
  return (
    <>
      {Array.from({ length: LAMP_LIGHTS }, (_, i) => (
        <pointLight key={i} ref={(el) => (lampLights.current[i] = el)} color="#FFC777" intensity={0} distance={20} decay={1.6} />
      ))}
      <hemisphereLight ref={hemi} args={["#DDEBFF", "#8A6E4A", 0.9]} />
      <directionalLight
        ref={sun}
        castShadow={shadows}
        intensity={2}
        shadow-mapSize-width={size}
        shadow-mapSize-height={size}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0005}
      />
    </>
  );
}
