// THE PLAYER CONTROLLER: reads input every frame, moves you, handles jumping, walls, traffic,
// and works out which door or person is close enough to show a prompt.

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { GRAVITY, JUMP_SPEED, MAP_LIMIT, PLAYER_RADIUS, RUN_SPEED, WALK_SPEED } from "../game/constants";
import { input } from "../game/input";
import { runtime } from "../game/runtime";
import { useGame } from "../game/store";
import { collideCircle } from "../game/systems/collision";
import { clamp, pick } from "../game/utils";
import { Person, type Motion } from "./Person";

const HIT_LINES = {
  danfo: ["Conductor: 'Oya comot for road! You wan die?'", "Danfo driver: 'Na road you dey sleep?'"],
  okada: ["Okada man: 'Watch where you dey waka!'", "The okada didn't even slow down."],
  car: ["A car clipped you. The driver shouted 'Sorry o!' and kept moving."],
  keke: ["Keke man: 'Aunty/Uncle, shift!'"],
};

export function Player({ shadows }: { shadows: boolean }) {
  const appearance = useGame((s) => s.sim?.appearance);
  const group = useRef<THREE.Group>(null!);
  const motion = useRef<Motion>({ speed: 0, air: false });
  const vel = useRef({ x: 0, z: 0, y: 0 });
  const hitCooldown = useRef(0);
  const promptTimer = useRef(0);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);
    const st = useGame.getState();
    const p = runtime.player;

    if (runtime.teleport) {
      p.x = runtime.teleport.x;
      p.z = runtime.teleport.z;
      p.y = 0;
      vel.current = { x: 0, z: 0, y: 0 };
      runtime.teleport = null;
    }

    const blocked = !!st.modal || performance.now() < runtime.blockInputUntil;
    let fwd = 0;
    let right = 0;
    let run = false;
    if (!blocked) {
      const k = input.keys;
      if (k.has("KeyW") || k.has("ArrowUp")) fwd += 1;
      if (k.has("KeyS") || k.has("ArrowDown")) fwd -= 1;
      if (k.has("KeyD") || k.has("ArrowRight")) right += 1;
      if (k.has("KeyA") || k.has("ArrowLeft")) right -= 1;
      fwd += input.joyY;
      right += input.joyX;
      run = k.has("ShiftLeft") || k.has("ShiftRight") || input.touchRun || Math.hypot(input.joyX, input.joyY) > 0.92;
    } else {
      input.jumpQueued = false;
    }

    // Move relative to where the camera looks.
    const yaw = runtime.cameraYaw;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = -fz;
    const rz = fx;
    let mx = fx * fwd + rx * right;
    let mz = fz * fwd + rz * right;
    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }
    const speed = run ? RUN_SPEED : WALK_SPEED;
    const v = vel.current;
    const accel = Math.min(1, dt * 12);
    v.x += (mx * speed - v.x) * accel;
    v.z += (mz * speed - v.z) * accel;

    p.x += v.x * dt;
    p.z += v.z * dt;
    collideCircle(p, PLAYER_RADIUS);
    p.x = clamp(p.x, -MAP_LIMIT, MAP_LIMIT);
    p.z = clamp(p.z, -MAP_LIMIT, MAP_LIMIT);

    // Jump
    const onGround = p.y <= 0.001;
    if (input.jumpQueued && onGround) v.y = JUMP_SPEED;
    input.jumpQueued = false;
    v.y -= GRAVITY * dt;
    p.y = Math.max(0, p.y + v.y * dt);
    if (p.y === 0 && v.y < 0) v.y = 0;

    // Face the way you're moving.
    const moving = Math.hypot(v.x, v.z) > 0.3;
    if (moving) {
      const target = Math.atan2(v.x, v.z);
      let diff = target - p.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      p.yaw += diff * Math.min(1, dt * 12);
    }
    p.moving = moving;
    p.running = run && moving;
    if (p.running) runtime.runSeconds += dt;

    // Traffic
    hitCooldown.current -= dt;
    for (const car of runtime.vehicles) {
      if (!car || p.y > 1.2) continue;
      const hl = car.alongX ? car.halfLong : car.halfWide;
      const hw = car.alongX ? car.halfWide : car.halfLong;
      const dx = p.x - car.x;
      const dz = p.z - car.z;
      if (Math.abs(dx) < hl + PLAYER_RADIUS && Math.abs(dz) < hw + PLAYER_RADIUS) {
        // Shove the player out sideways from the lane.
        if (car.alongX) p.z = car.z + Math.sign(dz || 1) * (hw + PLAYER_RADIUS + 0.4);
        else p.x = car.x + Math.sign(dx || 1) * (hl + PLAYER_RADIUS + 0.4);
        if (hitCooldown.current <= 0 && car.speed > 2) {
          hitCooldown.current = 2.5;
          st.toast(pick(HIT_LINES[car.kind]));
          const sim = st.sim;
          if (sim) {
            const s = structuredClone(sim);
            s.needs.health = Math.max(0, s.needs.health - (car.kind === "keke" ? 6 : 10));
            s.needs.happiness = Math.max(0, s.needs.happiness - 4);
            useGame.setState({ sim: s });
          }
        }
      }
    }

    group.current.position.set(p.x, p.y, p.z);
    group.current.rotation.y = p.yaw;
    motion.current.speed = Math.hypot(v.x, v.z);
    motion.current.air = p.y > 0.05;

    promptTimer.current -= dt;
    if (promptTimer.current <= 0) {
      promptTimer.current = 0.12;
      st.updatePrompt();
    }
  });

  if (!appearance) return null;
  return (
    <group ref={group}>
      <Person a={appearance} motion={motion} shadows={shadows} />
    </group>
  );
}
