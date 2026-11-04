// TRAFFIC: danfos, kekes, cars and okadas driving along the roads (on the right, like Nigeria).
// Each vehicle loops along one lane. Danfos and okadas don't brake for you. Cars do.

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { ROADS } from "../game/data/map";
import { runtime, type VehicleRuntime } from "../game/runtime";
import { mulberry32 } from "../game/utils";

type Kind = VehicleRuntime["kind"];
const SPECS: Record<Kind, { speed: number; halfLong: number; halfWide: number }> = {
  danfo: { speed: 9, halfLong: 2.6, halfWide: 1.1 },
  car: { speed: 11, halfLong: 2.1, halfWide: 0.95 },
  keke: { speed: 7, halfLong: 1.3, halfWide: 0.75 },
  okada: { speed: 12.5, halfLong: 1.0, halfWide: 0.4 },
};
const CAR_COLORS = ["#C0392B", "#2C3E50", "#ECF0F1", "#7F8C8D", "#1F4E79", "#16A085"];
const LOOP = 112;

interface Lane {
  road: (typeof ROADS)[number];
  offset: number;
  dir: 1 | -1;
}

function buildFleet() {
  const lanes: Lane[] = ROADS.flatMap((road) => {
    // Right-hand traffic: heading +z the right side is -x; heading +x the right side is +z.
    const plus: Lane = { road, offset: road.axis === "z" ? -3 : 3, dir: 1 };
    const minus: Lane = { road, offset: road.axis === "z" ? 3 : -3, dir: -1 };
    return [plus, minus];
  });
  const kinds: Kind[] = ["danfo", "car", "keke", "danfo", "okada", "car", "danfo", "car"];
  const rnd = mulberry32(42);
  const fleet: { lane: Lane; kind: Kind; color: string; t: number }[] = [];
  lanes.forEach((lane, li) => {
    const count = lane.road.axis === "z" ? 3 : 2;
    for (let i = 0; i < count; i++) {
      fleet.push({
        lane,
        kind: kinds[(li * 3 + i) % kinds.length],
        color: CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)],
        t: -LOOP + ((i + rnd() * 0.5) / count) * LOOP * 2,
      });
    }
  });
  return fleet;
}

export function Traffic({ shadows }: { shadows: boolean }) {
  const fleet = useMemo(buildFleet, []);
  return (
    <group>
      {fleet.map((v, i) => (
        <Vehicle key={i} index={i} lane={v.lane} kind={v.kind} color={v.color} start={v.t} shadows={shadows} />
      ))}
    </group>
  );
}

function Vehicle({ index, lane, kind, color, start, shadows }: { index: number; lane: Lane; kind: Kind; color: string; start: number; shadows: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  const t = useRef(start);
  const speed = useRef(SPECS[kind].speed);
  const alongX = lane.road.axis === "x";

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);
    const spec = SPECS[kind];
    // Look ahead: slow down behind another vehicle in the same lane, and (cars and kekes) for people.
    let target = spec.speed;
    const me = { x: 0, z: 0 };
    const pos = (tt: number) => (alongX ? { x: tt, z: lane.road.at + lane.offset } : { x: lane.road.at + lane.offset, z: tt });
    Object.assign(me, pos(t.current));
    for (const o of runtime.vehicles) {
      if (o === runtime.vehicles[index] || o.alongX !== alongX || o.dir !== lane.dir) continue;
      const sameLane = alongX ? Math.abs(o.z - me.z) < 1 : Math.abs(o.x - me.x) < 1;
      if (!sameLane) continue;
      const ahead = (alongX ? o.x - me.x : o.z - me.z) * lane.dir;
      if (ahead > 0 && ahead < 9) target = Math.min(target, o.speed * 0.9);
    }
    if (kind === "car" || kind === "keke") {
      const p = runtime.player;
      const ahead = (alongX ? p.x - me.x : p.z - me.z) * lane.dir;
      const side = alongX ? Math.abs(p.z - me.z) : Math.abs(p.x - me.x);
      if (ahead > 0 && ahead < 7 && side < 1.6) target = 0;
    }
    speed.current += (target - speed.current) * Math.min(1, dt * 3);
    t.current += speed.current * dt * lane.dir;
    if (t.current > LOOP) t.current = -LOOP;
    if (t.current < -LOOP) t.current = LOOP;
    const p = pos(t.current);
    ref.current.position.set(p.x, 0, p.z);
    runtime.vehicles[index] = { x: p.x, z: p.z, halfLong: spec.halfLong, halfWide: spec.halfWide, alongX, dir: lane.dir, speed: speed.current, kind };
  });

  const rotY = alongX ? (lane.dir === 1 ? Math.PI / 2 : -Math.PI / 2) : lane.dir === 1 ? 0 : Math.PI;
  return (
    <group ref={ref}>
      <group rotation={[0, rotY, 0]}>
        {kind === "danfo" && <Danfo shadows={shadows} />}
        {kind === "car" && <Car color={color} shadows={shadows} />}
        {kind === "keke" && <Keke shadows={shadows} />}
        {kind === "okada" && <Okada shadows={shadows} />}
      </group>
    </group>
  );
}

function Wheel({ x, z, r = 0.38 }: { x: number; z: number; r?: number }) {
  return (
    <mesh position={[x, r, z]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[r, r, 0.25, 12]} />
      <meshStandardMaterial color="#151515" roughness={0.9} />
    </mesh>
  );
}

function Danfo({ shadows }: { shadows: boolean }) {
  return (
    <group>
      <mesh position={[0, 1.35, 0]} castShadow={shadows}>
        <boxGeometry args={[2.1, 1.9, 5.2]} />
        <meshStandardMaterial color="#F5B700" roughness={0.6} />
      </mesh>
      {[0.95, 0.65].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[2.13, 0.1, 5.22]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      <mesh position={[0, 1.75, 0.2]}>
        <boxGeometry args={[2.14, 0.6, 4.2]} />
        <meshStandardMaterial color="#26333A" roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.6, 2.61]}>
        <boxGeometry args={[1.9, 0.8, 0.02]} />
        <meshStandardMaterial color="#26333A" roughness={0.2} />
      </mesh>
      <Wheel x={-1} z={1.7} />
      <Wheel x={1} z={1.7} />
      <Wheel x={-1} z={-1.7} />
      <Wheel x={1} z={-1.7} />
    </group>
  );
}

function Car({ color, shadows }: { color: string; shadows: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow={shadows}>
        <boxGeometry args={[1.8, 0.7, 4.2]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.35, -0.2]} castShadow={shadows}>
        <boxGeometry args={[1.6, 0.6, 2.2]} />
        <meshStandardMaterial color="#26333A" roughness={0.2} />
      </mesh>
      <Wheel x={-0.85} z={1.35} r={0.34} />
      <Wheel x={0.85} z={1.35} r={0.34} />
      <Wheel x={-0.85} z={-1.35} r={0.34} />
      <Wheel x={0.85} z={-1.35} r={0.34} />
    </group>
  );
}

function Keke({ shadows }: { shadows: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.85, -0.2]} castShadow={shadows}>
        <boxGeometry args={[1.4, 1.0, 1.8]} />
        <meshStandardMaterial color="#F5B700" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.75, -0.1]}>
        <boxGeometry args={[1.45, 0.08, 2.2]} />
        <meshStandardMaterial color="#0B5D3B" roughness={0.6} />
      </mesh>
      {[-0.65, 0.65].map((x) => (
        <mesh key={x} position={[x, 1.35, 0.85]}>
          <boxGeometry args={[0.06, 0.8, 0.06]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
      <Wheel x={0} z={1.0} r={0.28} />
      <Wheel x={-0.65} z={-0.8} r={0.3} />
      <Wheel x={0.65} z={-0.8} r={0.3} />
    </group>
  );
}

function Okada({ shadows }: { shadows: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow={shadows}>
        <boxGeometry args={[0.35, 0.4, 1.5]} />
        <meshStandardMaterial color="#B5371F" roughness={0.5} />
      </mesh>
      <Wheel x={0} z={0.7} r={0.33} />
      <Wheel x={0} z={-0.7} r={0.33} />
      {/* rider */}
      <mesh position={[0, 1.3, -0.1]} castShadow={shadows}>
        <boxGeometry args={[0.45, 0.65, 0.3]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.8, -0.05]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color="#5A3820" />
      </mesh>
    </group>
  );
}
