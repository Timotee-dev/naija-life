// A PERSON built from simple shapes: the player and every NPC use this.
// Limbs are groups that swing around the hip and shoulder while walking.

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import type * as THREE from "three";
import type { Appearance } from "../game/types";
import { ankaraTexture, jerseyTexture } from "./textures";

export interface Motion {
  speed: number; // metres per second
  air: boolean; // jumping
}

const STILL: Motion = { speed: 0, air: false };

export function Person({ a, motion, shadows = true }: { a: Appearance; motion?: MutableRefObject<Motion>; shadows?: boolean }) {
  const body = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const phase = useRef(Math.random() * 6);

  useFrame((_, dt) => {
    const m = motion?.current ?? STILL;
    const k = Math.min(1, m.speed / 4);
    phase.current += dt * (2.2 + m.speed * 1.5);
    const sw = Math.sin(phase.current);
    if (m.air) {
      legL.current.rotation.x = -0.7;
      legR.current.rotation.x = 0.35;
      armL.current.rotation.x = -2.4;
      armR.current.rotation.x = -2.2;
      body.current.position.y = 0;
      return;
    }
    const legSwing = sw * 0.75 * k;
    legL.current.rotation.x = legSwing;
    legR.current.rotation.x = -legSwing;
    const idle = Math.sin(phase.current * 0.5) * 0.04 * (1 - k);
    armL.current.rotation.x = -legSwing * 0.8 + idle;
    armR.current.rotation.x = legSwing * 0.8 - idle;
    body.current.position.y = Math.abs(sw) * 0.05 * k;
  });

  const female = a.gender === "female";
  const w = a.build * (female ? 0.92 : 1);
  const torsoW = 0.44 * w;
  const shoulderX = torsoW / 2 + 0.065;
  const longSleeve = a.top === "kaftan";
  const shortSleeve = !longSleeve;

  const topMat = useMemo(() => {
    if (a.top === "ankara") return { map: ankaraTexture(a.topColor), color: "#ffffff" };
    if (a.top === "jersey") return { map: jerseyTexture(a.topColor), color: "#ffffff" };
    return { map: null, color: a.topColor };
  }, [a.top, a.topColor]);

  const upperLeg = a.bottom === "skirt" ? a.skin : a.bottomColor;
  const lowerLeg = a.bottom === "trousers" ? a.bottomColor : a.skin;
  const cs = shadows;

  return (
    <group scale={a.height}>
      <group ref={body}>
        {/* Legs: pivot at the hip */}
        {[legL, legR].map((ref, i) => (
          <group key={i} ref={ref} position={[i === 0 ? -0.11 * w : 0.11 * w, 0.92, 0]}>
            <mesh position={[0, -0.22, 0]} castShadow={cs}>
              <boxGeometry args={[0.15, 0.44, 0.16]} />
              <meshStandardMaterial color={upperLeg} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.64, 0]} castShadow={cs}>
              <boxGeometry args={[0.13, 0.42, 0.14]} />
              <meshStandardMaterial color={lowerLeg} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.88, 0.05]} castShadow={cs}>
              <boxGeometry args={[0.15, 0.09, 0.28]} />
              <meshStandardMaterial color={a.shoes} roughness={0.6} />
            </mesh>
          </group>
        ))}

        {/* Torso */}
        <mesh position={[0, 1.2, 0]} castShadow={cs}>
          <boxGeometry args={[torsoW, 0.62, 0.26]} />
          <meshStandardMaterial key={`${a.top}-${a.topColor}`} color={topMat.color} map={topMat.map} roughness={0.9} />
        </mesh>
        {a.top === "kaftan" && (
          <mesh position={[0, 0.72, 0]} castShadow={cs}>
            <boxGeometry args={[torsoW * 1.05, 0.38, 0.27]} />
            <meshStandardMaterial color={a.topColor} roughness={0.9} />
          </mesh>
        )}
        {a.bottom === "skirt" && (
          <mesh position={[0, 0.66, 0]} castShadow={cs}>
            <cylinderGeometry args={[0.2 * w, 0.3 * w, 0.52, 14]} />
            <meshStandardMaterial color={a.bottomColor} roughness={0.9} />
          </mesh>
        )}
        {a.bottom !== "skirt" && a.top !== "kaftan" && (
          <mesh position={[0, 0.88, 0]}>
            <boxGeometry args={[torsoW * 0.98, 0.1, 0.25]} />
            <meshStandardMaterial color={a.bottomColor} roughness={0.9} />
          </mesh>
        )}

        {/* Arms: pivot at the shoulder */}
        {[armL, armR].map((ref, i) => (
          <group key={i} ref={ref} position={[i === 0 ? -shoulderX : shoulderX, 1.46, 0]}>
            <mesh position={[0, -0.15, 0]} castShadow={cs}>
              <boxGeometry args={[0.12, 0.32, 0.13]} />
              <meshStandardMaterial key={`${a.top}-${a.topColor}`} color={topMat.color} map={topMat.map} roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.45, 0]} castShadow={cs}>
              <boxGeometry args={[0.1, 0.3, 0.11]} />
              <meshStandardMaterial color={shortSleeve ? a.skin : a.topColor} roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.63, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color={a.skin} roughness={0.7} />
            </mesh>
          </group>
        ))}
        {a.top === "blouse" &&
          [-1, 1].map((sgn) => (
            <mesh key={sgn} position={[sgn * shoulderX, 1.43, 0]}>
              <sphereGeometry args={[0.1, 10, 10]} />
              <meshStandardMaterial color={a.topColor} roughness={0.9} />
            </mesh>
          ))}

        {/* Neck and head */}
        <mesh position={[0, 1.56, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.12, 10]} />
          <meshStandardMaterial color={a.skin} roughness={0.7} />
        </mesh>
        <Head a={a} castShadow={cs} />
        <Accessory a={a} />
      </group>
    </group>
  );
}

function Head({ a, castShadow }: { a: Appearance; castShadow: boolean }) {
  const r = a.gender === "female" ? 0.155 : 0.16;
  const hair = a.hairColor;
  const cap = (
    <mesh position={[0, 1.735, -0.005]}>
      <sphereGeometry args={[r + 0.012, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={hair} roughness={1} />
    </mesh>
  );
  return (
    <group>
      <mesh position={[0, 1.72, 0]} castShadow={castShadow}>
        <sphereGeometry args={[r, 20, 16]} />
        <meshStandardMaterial color={a.skin} roughness={0.65} />
      </mesh>
      {/* Eyes */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.055, 1.715, r - 0.012]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#111" roughness={0.3} />
        </mesh>
      ))}
      {/* Brows */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.055, 1.765, r - 0.01]} rotation={[0, 0, a.face === "serious" ? s * 0.35 : 0]}>
          <boxGeometry args={[0.06, 0.013, 0.01]} />
          <meshStandardMaterial color={hair} />
        </mesh>
      ))}
      {/* Mouth */}
      {a.face === "smiley" ? (
        <mesh position={[0, 1.66, r - 0.025]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.035, 0.008, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#5A1E1E" />
        </mesh>
      ) : (
        <mesh position={[0, 1.655, r - 0.01]}>
          <boxGeometry args={[a.face === "serious" ? 0.06 : 0.05, 0.01, 0.01]} />
          <meshStandardMaterial color="#5A1E1E" />
        </mesh>
      )}
      {a.beard && (
        <mesh position={[0, 1.63, 0.08]}>
          <boxGeometry args={[0.22, 0.09, 0.12]} />
          <meshStandardMaterial color={hair} roughness={1} />
        </mesh>
      )}
      {/* Hair */}
      {a.hair === "lowcut" && cap}
      {a.hair === "afro" && (
        <>
          {cap}
          <mesh position={[0, 1.86, -0.04]}>
            <sphereGeometry args={[0.22, 18, 14]} />
            <meshStandardMaterial color={hair} roughness={1} />
          </mesh>
        </>
      )}
      {a.hair === "bun" && (
        <>
          {cap}
          <mesh position={[0, 1.9, -0.08]}>
            <sphereGeometry args={[0.09, 12, 10]} />
            <meshStandardMaterial color={hair} roughness={1} />
          </mesh>
        </>
      )}
      {a.hair === "braids" && (
        <>
          {cap}
          {[-0.1, -0.05, 0, 0.05, 0.1].map((x, i) => (
            <mesh key={i} position={[x, 1.55, -0.12]} rotation={[0.15, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.014, 0.42, 6]} />
              <meshStandardMaterial color={hair} roughness={1} />
            </mesh>
          ))}
        </>
      )}
      {a.hair === "dreads" && (
        <>
          {cap}
          {Array.from({ length: 10 }, (_, i) => {
            const ang = Math.PI * 0.15 + (i / 9) * Math.PI * 0.7;
            return (
              <mesh key={i} position={[Math.cos(ang) * 0.15 * (i % 2 ? 1 : -1), 1.66, -Math.sin(ang) * 0.12]} rotation={[0.2, 0, 0]}>
                <cylinderGeometry args={[0.022, 0.02, 0.26, 6]} />
                <meshStandardMaterial color={hair} roughness={1} />
              </mesh>
            );
          })}
        </>
      )}
    </group>
  );
}

function Accessory({ a }: { a: Appearance }) {
  switch (a.accessory) {
    case "glasses":
      return (
        <group position={[0, 1.715, 0.16]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.055, 0, 0]}>
              <torusGeometry args={[0.035, 0.008, 6, 16]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          ))}
          <mesh>
            <boxGeometry args={[0.04, 0.01, 0.01]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      );
    case "cap":
      return (
        <group>
          <mesh position={[0, 1.75, 0]}>
            <sphereGeometry args={[0.178, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#1F2F5A" />
          </mesh>
          <mesh position={[0, 1.77, 0.17]}>
            <boxGeometry args={[0.22, 0.02, 0.14]} />
            <meshStandardMaterial color="#1F2F5A" />
          </mesh>
        </group>
      );
    case "chain":
      return (
        <mesh position={[0, 1.48, 0.06]} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[0.1, 0.013, 6, 20]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.3} />
        </mesh>
      );
    case "gele":
      return (
        <group>
          <mesh position={[0, 1.86, -0.02]} rotation={[0.25, 0, 0.15]}>
            <cylinderGeometry args={[0.24, 0.17, 0.2, 16]} />
            <meshStandardMaterial color={a.topColor} roughness={0.7} />
          </mesh>
          <mesh position={[0.14, 1.94, -0.05]} rotation={[0, 0, 0.6]}>
            <boxGeometry args={[0.16, 0.12, 0.04]} />
            <meshStandardMaterial color={a.topColor} roughness={0.7} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}
