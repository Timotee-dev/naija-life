// THE 3D SCENE: everything inside the <Canvas>.

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { MINUTES_PER_SECOND } from "../game/constants";
import { runtime } from "../game/runtime";
import { useGame } from "../game/store";
import { CameraRig } from "./CameraRig";
import { DayNight } from "./DayNight";
import { Npcs } from "./Npcs";
import { Player } from "./Player";
import { Traffic } from "./Traffic";
import { World } from "./World";

export function Scene() {
  const shadows = useGame((s) => s.settings.shadows);
  const quality = useGame((s) => s.settings.quality);
  return (
    <>
      <DayNight shadows={shadows} quality={quality} />
      <World shadows={shadows} />
      <Traffic shadows={shadows && quality === "high"} />
      <Npcs shadows={shadows && quality === "high"} />
      <Player shadows={shadows} />
      <Waypoint />
      <CameraRig />
      <SimClock />
    </>
  );
}

/** Moves the game clock forward while you're walking around, and commits it to the store 4× a second. */
function SimClock() {
  const acc = useRef(0);
  useFrame((_, dt) => {
    const st = useGame.getState();
    if (st.screen !== "game" || st.modal || !st.sim) return;
    runtime.liveTime += Math.min(dt, 0.1) * MINUTES_PER_SECOND * st.settings.timeSpeed;
    acc.current += dt;
    if (acc.current > 0.25) {
      acc.current = 0;
      st.tick(runtime.liveTime - st.sim.time);
    }
  });
  return null;
}

/** A tall glowing beam where your waypoint is. */
function Waypoint() {
  const wp = useGame((s) => s.sim?.waypoint);
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.y = 1 + Math.sin(clock.elapsedTime * 3) * 0.05;
  });
  if (!wp) return null;
  return (
    <mesh ref={ref} position={[wp.x, 15, wp.z]}>
      <cylinderGeometry args={[0.5, 0.5, 30, 12, 1, true]} />
      <meshBasicMaterial color="#F5B700" transparent opacity={0.35} depthWrite={false} />
    </mesh>
  );
}
