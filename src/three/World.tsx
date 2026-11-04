// THE STATIC WORLD: ground, roads, kerbs, buildings, street lamps, trees, bus stops, suya stall, pitch.
// Nothing here moves, so it renders once and stays.

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BUILDINGS, PITCH, ROAD_EXTENT, ROAD_HALF, ROADS, SIDEWALK, STOPS, SUYA_STALL, roadSegments, type BuildingDef, type Road, type StopDef } from "../game/data/map";
import { LAMP_SPOTS, TREE_SPOTS } from "./placements";
import { mulberry32 } from "../game/utils";
import { registerLamp, registerWindows } from "./glow";
import { facadeTextures, kerbTexture, pitchTexture, roadTexture, signTexture } from "./textures";

const hashId = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function shade(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return c;
}

export function World({ shadows }: { shadows: boolean }) {
  return (
    <group>
      <Ground />
      {ROADS.map((r) => (
        <RoadMesh key={r.id} road={r} />
      ))}
      <Junctions />
      {BUILDINGS.map((b) => (
        <Building key={b.id} b={b} shadows={shadows} />
      ))}
      <Lamps />
      <Trees shadows={shadows} />
      {STOPS.map((s) => (
        <BusStop key={s.id} stop={s} />
      ))}
      <SuyaStall />
      <Pitch />
      <Boundary />
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[440, 440]} />
      <meshStandardMaterial color="#B39A6B" roughness={1} />
    </mesh>
  );
}

// ---------- Roads ----------
function RoadMesh({ road }: { road: Road }) {
  const len = ROAD_EXTENT * 2;
  const tex = useMemo(() => {
    const t = roadTexture().clone();
    t.needsUpdate = true;
    t.repeat.set(1, len / 12);
    return t;
  }, [len]);
  const alongZ = road.axis === "z";
  const pos = (along: number, across: number, y: number): [number, number, number] => (alongZ ? [road.at + across, y, along] : [along, y, road.at + across]);
  const kerbs = roadSegments(road, ROAD_HALF);
  const walks = roadSegments(road, ROAD_HALF + SIDEWALK);

  return (
    <group>
      <mesh position={pos(0, 0, alongZ ? 0.01 : 0.012)} rotation={alongZ ? [-Math.PI / 2, 0, 0] : [-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
        <planeGeometry args={[ROAD_HALF * 2, len]} />
        <meshStandardMaterial map={tex} roughness={0.95} />
      </mesh>
      {walks.flatMap(([a, b]) =>
        [-1, 1].map((side) => (
          <mesh key={`w${a}${side}`} position={pos((a + b) / 2, side * (ROAD_HALF + SIDEWALK / 2), 0.03)} rotation={[-Math.PI / 2, 0, alongZ ? 0 : Math.PI / 2]} receiveShadow>
            <planeGeometry args={[SIDEWALK, b - a]} />
            <meshStandardMaterial color="#BDB5A6" roughness={1} />
          </mesh>
        )),
      )}
      {kerbs.flatMap(([a, b]) =>
        [-1, 1].map((side) => <Kerb key={`k${a}${side}`} center={pos((a + b) / 2, side * (ROAD_HALF + 0.12), 0.08)} length={b - a} alongZ={alongZ} />),
      )}
    </group>
  );
}

function Kerb({ center, length, alongZ }: { center: [number, number, number]; length: number; alongZ: boolean }) {
  const tex = useMemo(() => {
    const t = kerbTexture().clone();
    t.needsUpdate = true;
    t.repeat.set(length / 1.6, 1);
    return t;
  }, [length]);
  return (
    <mesh position={center} rotation={[0, alongZ ? Math.PI / 2 : 0, 0]}>
      <boxGeometry args={[length, 0.16, 0.25]} />
      <meshStandardMaterial map={tex} roughness={0.8} />
    </mesh>
  );
}

function Junctions() {
  const zs = ROADS.filter((r) => r.axis === "x").map((r) => r.at);
  const xs = ROADS.filter((r) => r.axis === "z").map((r) => r.at);
  return (
    <group>
      {xs.flatMap((x) =>
        zs.map((z) => (
          <mesh key={`${x},${z}`} position={[x, 0.016, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[ROAD_HALF * 2, ROAD_HALF * 2]} />
            <meshStandardMaterial color="#38383B" roughness={0.95} />
          </mesh>
        )),
      )}
    </group>
  );
}

// ---------- Buildings ----------
function frontOf(b: BuildingDef) {
  switch (b.facing) {
    case "+x": return { cx: b.x + b.w / 2, cz: b.z, nx: 1, nz: 0, rotY: Math.PI / 2, faceW: b.d };
    case "-x": return { cx: b.x - b.w / 2, cz: b.z, nx: -1, nz: 0, rotY: -Math.PI / 2, faceW: b.d };
    case "+z": return { cx: b.x, cz: b.z + b.d / 2, nx: 0, nz: 1, rotY: 0, faceW: b.w };
    case "-z": return { cx: b.x, cz: b.z - b.d / 2, nx: 0, nz: -1, rotY: Math.PI, faceW: b.w };
  }
}

function Building({ b, shadows }: { b: BuildingDef; shadows: boolean }) {
  const seed = hashId(b.id);
  const mats = useMemo(() => {
    const make = (faceW: number) => {
      const { map, emissive } = facadeTextures(b.style, b.color, faceW, b.h, seed + Math.round(faceW));
      return new THREE.MeshStandardMaterial({ map, emissiveMap: emissive, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0, roughness: b.style === "glass" ? 0.35 : 0.92, metalness: b.style === "glass" ? 0.25 : 0 });
    };
    const sideX = make(b.d);
    const sideZ = make(b.w);
    const roof = new THREE.MeshStandardMaterial({ color: shade(b.color, -0.28), roughness: 1 });
    return { list: [sideX, sideX, roof, roof, sideZ, sideZ], sideX, sideZ, roof };
  }, [b, seed]);

  useEffect(() => {
    const a = registerWindows(mats.sideX, !!b.gen);
    const c = registerWindows(mats.sideZ, !!b.gen);
    return () => {
      a();
      c();
      mats.sideX.dispose();
      mats.sideZ.dispose();
      mats.roof.dispose();
    };
  }, [mats, b.gen]);

  const f = frontOf(b);
  const signW = Math.min(f.faceW - 1.2, 11);
  const signH = Math.min(1.6, Math.max(1.1, signW / 6));
  const signTex = useMemo(() => (b.sign ? signTexture(b.sign.text, b.sign.bg, b.sign.fg, signW / signH) : null), [b.sign, signW, signH]);
  const signY = Math.min(b.h - 0.7, 3.5);
  const tx = -f.nz; // tangent along the front face
  const tz = f.nx;
  const rnd = mulberry32(seed);
  const roofCorner: [number, number] = [b.x + (rnd() - 0.5) * (b.w - 3), b.z + (rnd() - 0.5) * (b.d - 3)];

  return (
    <group>
      <mesh position={[b.x, b.h / 2, b.z]} material={mats.list} castShadow={shadows} receiveShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
      </mesh>
      {/* Parapet */}
      <mesh position={[b.x, b.h + 0.25, b.z]}>
        <boxGeometry args={[b.w + 0.3, 0.5, b.d + 0.3]} />
        <meshStandardMaterial color={shade(b.color, -0.12)} roughness={1} />
      </mesh>
      {/* Door */}
      <mesh position={[f.cx + f.nx * 0.04, 1.2, f.cz + f.nz * 0.04]} rotation={[0, f.rotY, 0]}>
        <boxGeometry args={[b.place ? 1.8 : 1.3, 2.4, 0.1]} />
        <meshStandardMaterial color={b.style === "glass" ? "#1D2B33" : b.place ? "#4A2E1C" : "#5B4636"} roughness={0.6} metalness={b.style === "glass" ? 0.4 : 0} />
      </mesh>
      {/* Sign */}
      {b.sign && signTex && (
        <mesh position={[f.cx + f.nx * 0.12, signY, f.cz + f.nz * 0.12]} rotation={[0, f.rotY, 0]}>
          <planeGeometry args={[signW, signH]} />
          <meshStandardMaterial map={signTex} roughness={0.5} emissive="#ffffff" emissiveMap={signTex} emissiveIntensity={0.15} />
        </mesh>
      )}
      {/* Roof extras: black water tank (houses), AC units (offices) */}
      {(b.style === "house" || b.style === "shop") && (
        <mesh position={[roofCorner[0], b.h + 0.9, roofCorner[1]]} castShadow={shadows}>
          <cylinderGeometry args={[0.75, 0.75, 1.5, 14]} />
          <meshStandardMaterial color="#1C1C1C" roughness={0.6} />
        </mesh>
      )}
      {(b.style === "office" || b.style === "glass") &&
        [0, 1].map((i) => (
          <mesh key={i} position={[roofCorner[0] + i * 1.6, b.h + 0.5, roofCorner[1]]}>
            <boxGeometry args={[1.2, 0.8, 0.8]} />
            <meshStandardMaterial color="#D9D9D9" roughness={0.7} />
          </mesh>
        ))}
      {b.style === "church" && (
        <group position={[f.cx - f.nx * 2, b.h + 2, f.cz - f.nz * 2]}>
          <mesh>
            <boxGeometry args={[0.35, 3.2, 0.35]} />
            <meshStandardMaterial color="#F5D27A" />
          </mesh>
          <mesh position={[0, 0.6, 0]} rotation={[0, f.rotY, 0]}>
            <boxGeometry args={[1.6, 0.35, 0.35]} />
            <meshStandardMaterial color="#F5D27A" />
          </mesh>
        </group>
      )}
      {/* Generator beside buildings that have one */}
      {b.gen && (
        <group position={[f.cx + f.nx * 1.0 + tx * (f.faceW / 2 - 1.2), 0, f.cz + f.nz * 1.0 + tz * (f.faceW / 2 - 1.2)]}>
          <mesh position={[0, 0.45, 0]} castShadow={shadows}>
            <boxGeometry args={[1.1, 0.9, 0.75]} />
            <meshStandardMaterial color="#2D6A3E" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.96, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 6]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ---------- Street lamps (instanced: one draw call for all of them) ----------
function Lamps() {
  const spots = LAMP_SPOTS();
  const poles = useRef<THREE.InstancedMesh>(null!);
  const heads = useRef<THREE.InstancedMesh>(null!);
  const bulbMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FFF2C4", emissive: new THREE.Color("#FFD27A"), emissiveIntensity: 0 }), []);
  useEffect(() => registerLamp(bulbMat), [bulbMat]);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    spots.forEach((s, i) => {
      d.position.set(s.x, 2.9, s.z);
      d.rotation.set(0, 0, 0);
      d.updateMatrix();
      poles.current.setMatrixAt(i, d.matrix);
      d.position.set(s.x + s.armX * 0.8, 5.7, s.z + s.armZ * 0.8);
      d.updateMatrix();
      heads.current.setMatrixAt(i, d.matrix);
    });
    poles.current.instanceMatrix.needsUpdate = true;
    heads.current.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <group>
      <instancedMesh ref={poles} args={[undefined, undefined, spots.length]}>
        <cylinderGeometry args={[0.07, 0.1, 5.8, 6]} />
        <meshStandardMaterial color="#5C6166" roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, bulbMat, spots.length]}>
        <boxGeometry args={[0.7, 0.16, 0.7]} />
      </instancedMesh>
    </group>
  );
}

function Trees({ shadows }: { shadows: boolean }) {
  const spots = TREE_SPOTS();
  const trunks = useRef<THREE.InstancedMesh>(null!);
  const crowns = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const rnd = mulberry32(3);
    spots.forEach((s, i) => {
      const k = 0.8 + rnd() * 0.5;
      d.position.set(s.x, 1.3 * k, s.z);
      d.scale.set(k, k, k);
      d.updateMatrix();
      trunks.current.setMatrixAt(i, d.matrix);
      d.position.set(s.x, 3.4 * k, s.z);
      d.scale.set(k * 1.1, k * 0.85, k * 1.1);
      d.updateMatrix();
      crowns.current.setMatrixAt(i, d.matrix);
    });
    trunks.current.instanceMatrix.needsUpdate = true;
    crowns.current.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]} castShadow={shadows}>
        <cylinderGeometry args={[0.16, 0.24, 2.6, 7]} />
        <meshStandardMaterial color="#6B4A2E" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, spots.length]} castShadow={shadows}>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshStandardMaterial color="#3F7A39" roughness={1} flatShading />
      </instancedMesh>
    </group>
  );
}

// ---------- Bus stop shelter ----------
function BusStop({ stop }: { stop: StopDef }) {
  const rot = stop.facing === "-x" ? -Math.PI / 2 : stop.facing === "+x" ? Math.PI / 2 : stop.facing === "+z" ? 0 : Math.PI;
  const signTex = useMemo(() => signTexture("BUS STOP", "#0B5D3B", "#FFFFFF", 3), []);
  const nameTex = useMemo(() => signTexture(stop.name.replace(" Bus Stop", "").toUpperCase(), "#F5B700", "#1E1E1E", 3.4), [stop.name]);
  // Local frame: shelter opens toward +z, back wall at z = -1.6
  const cx = stop.x + (stop.facing === "-x" ? 0.2 : stop.facing === "+x" ? -0.2 : 0);
  const cz = stop.z + (stop.facing === "+z" ? -0.2 : stop.facing === "-z" ? 0.2 : 0);
  return (
    <group position={[cx, 0, cz]} rotation={[0, rot, 0]}>
      <mesh position={[0, 1.2, -1.4]}>
        <boxGeometry args={[4, 2.4, 0.08]} />
        <meshStandardMaterial color="#C9D6DC" transparent opacity={0.55} roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.5, -0.6]}>
        <boxGeometry args={[4.4, 0.12, 2]} />
        <meshStandardMaterial color="#0B5D3B" roughness={0.6} />
      </mesh>
      {[-2, 2].map((x) => (
        <mesh key={x} position={[x, 1.25, -1.4]}>
          <boxGeometry args={[0.1, 2.5, 0.1]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      ))}
      <mesh position={[0, 0.45, -1.0]}>
        <boxGeometry args={[3.2, 0.1, 0.5]} />
        <meshStandardMaterial color="#8C6D3F" />
      </mesh>
      <mesh position={[0, 2.85, -0.6]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshStandardMaterial map={signTex} />
      </mesh>
      <mesh position={[0, 2.85, -0.59]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.4, 0.8]} />
        <meshStandardMaterial map={nameTex} />
      </mesh>
    </group>
  );
}

function SuyaStall() {
  const coal = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3A1A0A", emissive: new THREE.Color("#FF5A1F"), emissiveIntensity: 0 }), []);
  useEffect(() => registerLamp(coal), [coal]);
  const { x, z, w, d } = SUYA_STALL;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[w, 1, d]} />
        <meshStandardMaterial color="#6B4A2E" roughness={1} />
      </mesh>
      <mesh position={[-0.4, 1.06, 0]} material={coal}>
        <boxGeometry args={[1, 0.12, 1.8]} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.2, 6]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[0, 2.7, 0]}>
        <coneGeometry args={[1.8, 0.7, 10]} />
        <meshStandardMaterial color="#C0392B" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Pitch() {
  const tex = useMemo(() => pitchTexture(), []);
  const cx = (PITCH.minX + PITCH.maxX) / 2;
  const cz = (PITCH.minZ + PITCH.maxZ) / 2;
  const w = PITCH.maxX - PITCH.minX;
  const d = PITCH.maxZ - PITCH.minZ;
  return (
    <group>
      <mesh position={[cx, 0.02, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
      {[PITCH.minZ + 0.6, PITCH.maxZ - 0.6].map((gz) => (
        <group key={gz} position={[cx, 0, gz]}>
          {[-3.6, 3.6].map((gx) => (
            <mesh key={gx} position={[gx, 1.2, 0]}>
              <boxGeometry args={[0.15, 2.4, 0.15]} />
              <meshStandardMaterial color="#F2F2F2" />
            </mesh>
          ))}
          <mesh position={[0, 2.4, 0]}>
            <boxGeometry args={[7.35, 0.15, 0.15]} />
            <meshStandardMaterial color="#F2F2F2" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Boundary() {
  const L = 214;
  const walls: [number, number, number, number][] = [
    [0, -107, L, 0.4],
    [0, 107, L, 0.4],
    [-107, 0, 0.4, L],
    [107, 0, 0.4, L],
  ];
  return (
    <group>
      {walls.map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 1.1, z]}>
          <boxGeometry args={[w, 2.2, d]} />
          <meshStandardMaterial color="#A89F8F" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
