// NPCs: named characters follow their daily schedule; passers-by stroll along the sidewalks.

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { randomAppearance } from "../game/data/appearance";
import { ROAD_HALF, ROADS } from "../game/data/map";
import { NPCS, PED_LINES, PED_NAMES, type NpcDef } from "../game/data/npcs";
import { runtime } from "../game/runtime";
import { hourOf, mulberry32, weekdayOf } from "../game/utils";
import { Person, type Motion } from "./Person";

export function Npcs({ shadows }: { shadows: boolean }) {
  const peds = useMemo(() => {
    const rnd = mulberry32(2024);
    return Array.from({ length: 14 }, (_, i) => {
      const road = ROADS[i % ROADS.length];
      const side = rnd() < 0.5 ? -1 : 1;
      return {
        id: i,
        appearance: randomAppearance(rnd),
        road,
        offset: side * (ROAD_HALF + 1.6 + (rnd() - 0.5) * 1.2),
        start: -90 + rnd() * 180,
        name: PED_NAMES[Math.floor(rnd() * PED_NAMES.length)],
        line: PED_LINES[Math.floor(rnd() * PED_LINES.length)],
        nightOwl: rnd() < 0.3,
        speed: 1.1 + rnd() * 0.6,
      };
    });
  }, []);

  return (
    <group>
      {NPCS.map((n) => (
        <Named key={n.id} npc={n} shadows={shadows} />
      ))}
      {peds.map((p) => (
        <Pedestrian key={p.id} {...p} shadows={shadows} />
      ))}
    </group>
  );
}

function Named({ npc, shadows }: { npc: NpcDef; shadows: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  const motion = useRef<Motion>({ speed: 0, air: false });
  const t = useRef(Math.random() * 10);

  useFrame((_, dt) => {
    t.current += dt;
    const time = runtime.liveTime;
    const spot = npc.schedule(weekdayOf(time), hourOf(time));
    const g = ref.current;
    if (!spot) {
      g.visible = false;
      runtime.npcs.set(npc.id, { x: 9999, z: 9999, visible: false });
      return;
    }
    g.visible = true;
    const talking = runtime.talkingTo === npc.id;
    // Idle: shuffle around their spot a little.
    const wander = talking ? 0 : 0.6;
    const x = spot[0] + Math.sin(t.current * 0.23) * wander;
    const z = spot[1] + Math.cos(t.current * 0.17) * wander;
    const dx = x - g.position.x;
    const dz = z - g.position.z;
    const far = Math.hypot(dx, dz) > 6;
    g.position.x = far ? x : g.position.x + dx * Math.min(1, dt * 2);
    g.position.z = far ? z : g.position.z + dz * Math.min(1, dt * 2);
    motion.current.speed = far ? 0 : Math.hypot(dx, dz) * 2;
    if (talking) {
      const p = runtime.player;
      g.rotation.y = Math.atan2(p.x - g.position.x, p.z - g.position.z);
    } else if (motion.current.speed > 0.05) {
      g.rotation.y = Math.atan2(dx, dz);
    }
    runtime.npcs.set(npc.id, { x: g.position.x, z: g.position.z, visible: true });
  });

  return (
    <group ref={ref}>
      <Person a={npc.appearance} motion={motion} shadows={shadows} />
    </group>
  );
}

function Pedestrian(props: {
  id: number;
  appearance: ReturnType<typeof randomAppearance>;
  road: (typeof ROADS)[number];
  offset: number;
  start: number;
  name: string;
  line: string;
  nightOwl: boolean;
  speed: number;
  shadows: boolean;
}) {
  const ref = useRef<THREE.Group>(null!);
  const motion = useRef<Motion>({ speed: 0, air: false });
  const pos = useRef(props.start);
  const target = useRef(props.start);
  const pause = useRef(0);
  const rnd = useMemo(() => mulberry32(props.id * 97 + 5), [props.id]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);
    const g = ref.current;
    const h = hourOf(runtime.liveTime);
    const night = h >= 22 || h < 6;
    const visible = !night || props.nightOwl;
    g.visible = visible;
    if (!visible) {
      runtime.peds.set(props.id, { x: 9999, z: 9999, visible: false, name: props.name, line: props.line });
      return;
    }
    const p = runtime.player;
    const alongZ = props.road.axis === "z";
    const wx = alongZ ? props.road.at + props.offset : pos.current;
    const wz = alongZ ? pos.current : props.road.at + props.offset;
    const near = Math.hypot(p.x - wx, p.z - wz) < 1.6;

    if (pause.current > 0) {
      pause.current -= dt;
      motion.current.speed = 0;
    } else if (near) {
      motion.current.speed = 0;
    } else {
      const diff = target.current - pos.current;
      if (Math.abs(diff) < 0.3) {
        target.current = -95 + rnd() * 190;
        pause.current = rnd() * 4;
      } else {
        const step = Math.sign(diff) * Math.min(Math.abs(diff), props.speed * dt);
        pos.current += step;
        motion.current.speed = props.speed;
        const dir = Math.sign(diff);
        g.rotation.y = alongZ ? (dir > 0 ? 0 : Math.PI) : dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
    }
    if (near) g.rotation.y = Math.atan2(p.x - wx, p.z - wz);
    g.position.set(wx, 0, wz);
    runtime.peds.set(props.id, { x: wx, z: wz, visible: true, name: props.name, line: props.line });
  });

  return (
    <group ref={ref}>
      <Person a={props.appearance} motion={motion} shadows={props.shadows} />
    </group>
  );
}
