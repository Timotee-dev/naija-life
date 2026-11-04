// CHARACTER CREATION: pick your look and your starting life, with a live 3D preview.

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type * as THREE from "three";
import {
  ACCESSORIES, ACCESSORY_LABELS, BOTTOMS, BOTTOM_LABELS, CLOTH_COLORS, FACES, FACE_LABELS, HAIRS, HAIR_COLORS, HAIR_LABELS,
  SHOE_COLORS, SKIN_TONES, TOPS, TOP_LABELS, defaultAppearance, randomAppearance,
} from "../game/data/appearance";
import { BACKGROUNDS, HOMES } from "../game/data/backgrounds";
import { useGame } from "../game/store";
import type { Appearance, BackgroundId } from "../game/types";
import { naira } from "../game/utils";
import { Person } from "../three/Person";

type Tab = "life" | "look" | "clothes" | "body";
const NAMES = { male: ["Tobi", "Chidi", "Emeka", "Femi", "Musa", "Kunle"], female: ["Ada", "Funke", "Zainab", "Amaka", "Bimpe", "Ngozi"] };

export function CharacterCreator() {
  const goto = useGame((s) => s.goto);
  const start = useGame((s) => s.startNewGame);
  const [a, setA] = useState<Appearance>(() => defaultAppearance("male"));
  const [name, setName] = useState("");
  const [bg, setBg] = useState<BackgroundId>("student");
  const [tab, setTab] = useState<Tab>("life");
  const set = (p: Partial<Appearance>) => setA((cur) => ({ ...cur, ...p }));
  const trimmed = name.trim();

  return (
    <div className="creator">
      <div className="creator-preview">
        <Canvas camera={{ position: [0, 1.15, 5.4], fov: 32 }} shadows dpr={[1, 2]} onCreated={({ camera }) => camera.lookAt(0, 0.92, 0)}>
          <color attach="background" args={["#123426"]} />
          <hemisphereLight args={["#FFF4E2", "#2B4A3A", 1.1]} />
          <directionalLight position={[3, 5, 4]} intensity={2.2} castShadow />
          <Turntable a={a} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[1.3, 40]} />
            <meshStandardMaterial color="#F5B700" />
          </mesh>
        </Canvas>
        <div className="preview-name">
          <span className="eyebrow">{BACKGROUNDS[bg].name}</span>
          <b>{trimmed || "Your name"}</b>
        </div>
      </div>

      <div className="creator-form">
        <div className="creator-head">
          <h1 className="h1">Create your life</h1>
          <button className="btn ghost" onClick={() => setA(randomAppearance(Math.random, a.gender))}>Randomise look</button>
        </div>
        <div className="tabs" role="tablist">
          {(["life", "look", "clothes", "body"] as Tab[]).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {{ life: "You", look: "Face & hair", clothes: "Clothes", body: "Body" }[t]}
            </button>
          ))}
        </div>

        <div className="tab-body">
          {tab === "life" && (
            <>
              <label className="field">
                <span>Name</span>
                <input id="char-name" value={name} maxLength={18} placeholder="e.g. Tobi" onChange={(e) => setName(e.target.value)} />
              </label>
              <div className="name-ideas">
                {NAMES[a.gender].map((n) => (
                  <button key={n} className="chip" onClick={() => setName(n)}>{n}</button>
                ))}
              </div>
              <Row label="Gender">
                {(["male", "female"] as const).map((g) => (
                  <button key={g} className={`chip ${a.gender === g ? "on" : ""}`} onClick={() => setA({ ...defaultAppearance(g), skin: a.skin })}>
                    {g === "male" ? "Male" : "Female"}
                  </button>
                ))}
              </Row>
              <p className="label">Starting life</p>
              <div className="bg-cards">
                {(Object.keys(BACKGROUNDS) as BackgroundId[]).map((id) => {
                  const b = BACKGROUNDS[id];
                  return (
                    <button key={id} className={`bg-card ${bg === id ? "on" : ""}`} onClick={() => setBg(id)}>
                      <b>{b.name}</b>
                      <span>{b.blurb}</span>
                      <span className="mono">{naira(b.cash)} cash · {naira(b.bank)} bank</span>
                      <span className="small">Home: {HOMES[b.home].short}{HOMES[b.home].rent ? ` (${naira(HOMES[b.home].rent)}/week)` : " (free)"}</span>
                      <ul>
                        {b.perks.map((p) => <li key={p}>{p}</li>)}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {tab === "look" && (
            <>
              <Swatches label="Skin tone" colors={SKIN_TONES} value={a.skin} onPick={(skin) => set({ skin })} />
              <Row label="Face">{FACES.map((f) => <Chip key={f} on={a.face === f} onClick={() => set({ face: f })}>{FACE_LABELS[f]}</Chip>)}</Row>
              <Row label="Hairstyle">{HAIRS.map((h) => <Chip key={h} on={a.hair === h} onClick={() => set({ hair: h })}>{HAIR_LABELS[h]}</Chip>)}</Row>
              <Swatches label="Hair colour" colors={HAIR_COLORS} value={a.hairColor} onPick={(hairColor) => set({ hairColor })} />
              {a.gender === "male" && <Row label="Beard"><Chip on={!a.beard} onClick={() => set({ beard: false })}>None</Chip><Chip on={a.beard} onClick={() => set({ beard: true })}>Beard</Chip></Row>}
            </>
          )}

          {tab === "clothes" && (
            <>
              <Row label="Top">{TOPS.map((t) => <Chip key={t} on={a.top === t} onClick={() => set({ top: t })}>{TOP_LABELS[t]}</Chip>)}</Row>
              <Swatches label="Top colour" colors={CLOTH_COLORS} value={a.topColor} onPick={(topColor) => set({ topColor })} />
              <Row label="Bottom">{BOTTOMS.map((b) => <Chip key={b} on={a.bottom === b} onClick={() => set({ bottom: b })}>{BOTTOM_LABELS[b]}</Chip>)}</Row>
              <Swatches label="Bottom colour" colors={CLOTH_COLORS} value={a.bottomColor} onPick={(bottomColor) => set({ bottomColor })} />
              <Swatches label="Footwear" colors={SHOE_COLORS} value={a.shoes} onPick={(shoes) => set({ shoes })} />
              <Row label="Accessory">{ACCESSORIES.map((x) => <Chip key={x} on={a.accessory === x} onClick={() => set({ accessory: x })}>{ACCESSORY_LABELS[x]}</Chip>)}</Row>
            </>
          )}

          {tab === "body" && (
            <>
              <Slider label="Height" min={0.9} max={1.1} value={a.height} onChange={(height) => set({ height })} show={`${Math.round(a.height * 175)} cm`} />
              <Slider label="Build" min={0.85} max={1.2} value={a.build} onChange={(build) => set({ build })} show={a.build < 0.95 ? "Slim" : a.build < 1.08 ? "Average" : "Broad"} />
            </>
          )}
        </div>

        <div className="creator-foot">
          <button className="btn" onClick={() => goto("menu")}>Back</button>
          <button className="btn primary big" disabled={!trimmed} onClick={() => start(trimmed, a, bg)}>
            {trimmed ? "Start your life" : "Enter a name to start"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Turntable({ a }: { a: Appearance }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.5;
  });
  return (
    <group ref={ref} position={[0, 0, 0]}>
      <Person a={a} />
    </group>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="opt-row">
      <p className="label">{label}</p>
      <div className="chips">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={`chip ${on ? "on" : ""}`} onClick={onClick}>{children}</button>;
}

function Swatches({ label, colors, value, onPick }: { label: string; colors: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div className="opt-row">
      <p className="label">{label}</p>
      <div className="swatches">
        {colors.map((c) => (
          <button key={c} className={`swatch ${value === c ? "on" : ""}`} style={{ background: c }} aria-label={`${label} ${c}`} onClick={() => onPick(c)} />
        ))}
      </div>
    </div>
  );
}

function Slider({ label, min, max, value, onChange, show }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void; show: string }) {
  const id = `slider-${label.toLowerCase()}`;
  return (
    <label className="field" htmlFor={id}>
      <span>{label} <em className="muted">{show}</em></span>
      <input id={id} type="range" min={min} max={max} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
