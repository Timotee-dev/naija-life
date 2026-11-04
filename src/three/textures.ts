// TEXTURES DRAWN IN CODE. No image files: every facade, sign and road marking is painted on a <canvas>.

import * as THREE from "three";
import type { BuildingStyle } from "../game/data/map";
import { mulberry32 } from "../game/utils";

const cache = new Map<string, THREE.Texture>();

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function toTexture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function cached(key: string, make: () => THREE.Texture) {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

function shade(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return `#${c.getHexString()}`;
}

/**
 * A building wall: paint, rain stains, windows with burglar-proof bars.
 * Returns a colour map and a matching "emissive" map where lit windows glow at night.
 */
const pairs = new Map<string, { map: THREE.Texture; emissive: THREE.Texture }>();

export function facadeTextures(style: BuildingStyle, color: string, faceW: number, h: number, seed: number) {
  const key = `facade:${style}:${color}:${faceW}:${h}:${seed}`;
  const hit = pairs.get(key);
  if (hit) return hit;
  {
    const PX = 20;
    const W = Math.min(512, Math.max(64, Math.round(faceW * PX)));
    const H = Math.min(512, Math.max(64, Math.round(h * PX)));
    const sx = W / faceW;
    const sy = H / h;
    const [c, g] = makeCanvas(W, H);
    const [ec, eg] = makeCanvas(W, H);
    const rnd = mulberry32(seed);
    eg.fillStyle = "#000";
    eg.fillRect(0, 0, W, H);
    const done = () => {
      const pair = { map: toTexture(c), emissive: toTexture(ec) };
      pairs.set(key, pair);
      return pair;
    };

    g.fillStyle = color;
    g.fillRect(0, 0, W, H);
    // Rain stains running down from the roof
    for (let i = 0; i < W / 18; i++) {
      g.fillStyle = `rgba(60,45,30,${0.04 + rnd() * 0.07})`;
      const x = rnd() * W;
      g.fillRect(x, 0, 3 + rnd() * 10, H * (0.2 + rnd() * 0.6));
    }
    // Base band (dirt splash from the road)
    g.fillStyle = shade(color, -0.18);
    g.fillRect(0, H - 0.5 * sy, W, 0.5 * sy);

    const lit = () => rnd() < 0.62;
    const glowColor = () => (rnd() < 0.2 ? "#E8F4FF" : "#FFD27A");

    if (style === "glass") {
      const cols = Math.max(2, Math.floor(faceW / 2.2));
      const rows = Math.max(2, Math.floor(h / 3));
      const cw = W / cols;
      const rh = H / rows;
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          g.fillStyle = rnd() < 0.5 ? "#2E4B5E" : "#3A6075";
          g.fillRect(k * cw + 2, r * rh + 2, cw - 4, rh - 4);
          g.fillStyle = "rgba(255,255,255,0.12)";
          g.fillRect(k * cw + 2, r * rh + 2, cw * 0.35, rh - 4);
          if (lit()) {
            eg.fillStyle = glowColor();
            eg.fillRect(k * cw + 3, r * rh + 3, cw - 6, rh - 6);
          }
        }
      }
      return done();
    }

    if (style === "market") {
      const stalls = Math.max(3, Math.floor(faceW / 3.2));
      const sw = W / stalls;
      const awnings = ["#E5533D", "#F5B700", "#2E8B57", "#2F6DB3", "#E46A8C"];
      for (let k = 0; k < stalls; k++) {
        const col = awnings[Math.floor(rnd() * awnings.length)];
        // goods
        for (let i = 0; i < 6; i++) {
          g.fillStyle = ["#C0392B", "#F39C12", "#27AE60", "#8E44AD", "#D35400", "#ECF0F1"][Math.floor(rnd() * 6)];
          g.fillRect(k * sw + 4 + rnd() * (sw - 14), H * 0.55 + rnd() * H * 0.25, 6 + rnd() * 8, 6 + rnd() * 8);
        }
        // striped awning
        for (let s = 0; s < 6; s++) {
          g.fillStyle = s % 2 ? col : "#FFF6E0";
          g.fillRect(k * sw + (s * sw) / 6, H * 0.32, sw / 6, H * 0.14);
        }
        if (lit()) {
          eg.fillStyle = "#FFB347";
          eg.fillRect(k * sw + 6, H * 0.5, sw - 12, H * 0.3);
        }
      }
      return done();
    }

    const floorH = 3.2;
    const floors = Math.max(1, Math.floor(h / floorH));
    const winW = style === "church" ? 1.1 : 1.3;
    const winH = style === "church" ? 2.6 : 1.5;
    const spacing = style === "church" ? 3.4 : 2.9;
    const cols = Math.max(1, Math.floor((faceW - 1) / spacing));
    const offsetX = (faceW - (cols - 1) * spacing) / 2;
    for (let f = 0; f < floors; f++) {
      const isGround = f === 0;
      const yBottom = h - (f * floorH + (isGround ? 0.9 : 1.0));
      if (isGround && style === "shop") {
        // Big shop window either side of the door
        g.fillStyle = "#26333A";
        g.fillRect(0.6 * sx, (h - 2.6) * sy, (faceW / 2 - 1.6) * sx, 2.0 * sy);
        g.fillRect((faceW / 2 + 1.0) * sx, (h - 2.6) * sy, (faceW / 2 - 1.6) * sx, 2.0 * sy);
        eg.fillStyle = "#FFE3A3";
        eg.fillRect(0.6 * sx, (h - 2.6) * sy, (faceW / 2 - 1.6) * sx, 2.0 * sy);
        eg.fillRect((faceW / 2 + 1.0) * sx, (h - 2.6) * sy, (faceW / 2 - 1.6) * sx, 2.0 * sy);
        continue;
      }
      for (let k = 0; k < cols; k++) {
        const cx = offsetX + k * spacing;
        if (isGround && Math.abs(cx - faceW / 2) < 1.4) continue; // leave room for the door
        const x = (cx - winW / 2) * sx;
        const y = (yBottom - winH) * sy;
        g.fillStyle = shade(color, -0.25);
        g.fillRect(x - 3, y - 3, winW * sx + 6, winH * sy + 6);
        g.fillStyle = "#2A3238";
        if (style === "church") {
          g.beginPath();
          g.moveTo(x, y + winH * sy);
          g.lineTo(x, y + (winW * sx) / 2);
          g.arc(x + (winW * sx) / 2, y + (winW * sx) / 2, (winW * sx) / 2, Math.PI, 0);
          g.lineTo(x + winW * sx, y + winH * sy);
          g.fill();
          g.fillStyle = "rgba(120,80,200,0.4)";
          g.fillRect(x + 2, y + winH * sy * 0.4, winW * sx - 4, winH * sy * 0.5);
        } else {
          g.fillRect(x, y, winW * sx, winH * sy);
          // Burglar-proof bars
          g.fillStyle = "rgba(30,30,30,0.85)";
          for (let b = 1; b < 5; b++) g.fillRect(x + (b * winW * sx) / 5 - 1, y, 2, winH * sy);
          g.fillRect(x, y + (winH * sy) / 2 - 1, winW * sx, 2);
        }
        if (lit()) {
          eg.fillStyle = glowColor();
          eg.fillRect(x, y, winW * sx, winH * sy);
        }
      }
      // Floor line
      g.fillStyle = shade(color, -0.08);
      g.fillRect(0, (h - f * floorH - floorH) * sy, W, 2);
    }
    return done();
  }
}

/** Shop sign with auto-fitted text. */
export function signTexture(text: string, bg: string, fg: string, aspect: number) {
  return cached(`sign:${text}:${bg}:${fg}:${aspect.toFixed(2)}`, () => {
    const W = 512;
    const H = Math.max(48, Math.round(W / aspect));
    const [c, g] = makeCanvas(W, H);
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = fg;
    g.globalAlpha = 0.35;
    g.lineWidth = 4;
    g.strokeRect(6, 6, W - 12, H - 12);
    g.globalAlpha = 1;
    let size = H * 0.62;
    g.font = `900 ${size}px "Arial Black", Impact, system-ui, sans-serif`;
    while (g.measureText(text).width > W * 0.9 && size > 10) {
      size -= 2;
      g.font = `900 ${size}px "Arial Black", Impact, system-ui, sans-serif`;
    }
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, W / 2, H / 2 + 2);
    return toTexture(c);
  });
}

/** Asphalt with a dashed white centre line. Repeat it along the road. */
export function roadTexture() {
  return cached("road", () => {
    const [c, g] = makeCanvas(128, 128);
    g.fillStyle = "#3B3B3E";
    g.fillRect(0, 0, 128, 128);
    const rnd = mulberry32(7);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = `rgba(${rnd() < 0.5 ? "255,255,255" : "0,0,0"},${0.04 + rnd() * 0.05})`;
      g.fillRect(rnd() * 128, rnd() * 128, 2, 2);
    }
    // Patched potholes
    for (let i = 0; i < 2; i++) {
      g.fillStyle = "rgba(20,20,20,0.35)";
      g.beginPath();
      g.ellipse(20 + rnd() * 90, rnd() * 128, 6 + rnd() * 6, 4 + rnd() * 4, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#E8E4D8";
    g.fillRect(62, 0, 4, 64);
    const t = toTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}

/** Lagos kerb stones painted yellow and black. */
export function kerbTexture() {
  return cached("kerb", () => {
    const [c, g] = makeCanvas(64, 16);
    g.fillStyle = "#F2C230";
    g.fillRect(0, 0, 32, 16);
    g.fillStyle = "#1B1B1B";
    g.fillRect(32, 0, 32, 16);
    const t = toTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}

export function pitchTexture() {
  return cached("pitch", () => {
    const [c, g] = makeCanvas(256, 420);
    for (let i = 0; i < 10; i++) {
      g.fillStyle = i % 2 ? "#4E8A3A" : "#568F40";
      g.fillRect(0, i * 42, 256, 42);
    }
    // Worn dusty patches
    const rnd = mulberry32(11);
    for (let i = 0; i < 18; i++) {
      g.fillStyle = "rgba(170,140,90,0.45)";
      g.beginPath();
      g.ellipse(rnd() * 256, rnd() * 420, 10 + rnd() * 24, 8 + rnd() * 18, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "rgba(255,255,255,0.85)";
    g.lineWidth = 3;
    g.strokeRect(10, 10, 236, 400);
    g.beginPath();
    g.moveTo(10, 210);
    g.lineTo(246, 210);
    g.stroke();
    g.beginPath();
    g.arc(128, 210, 34, 0, Math.PI * 2);
    g.stroke();
    g.strokeRect(68, 10, 120, 55);
    g.strokeRect(68, 355, 120, 55);
    return toTexture(c);
  });
}

/** Ankara wax-print pattern in the given colour. */
export function ankaraTexture(color: string) {
  return cached(`ankara:${color}`, () => {
    const [c, g] = makeCanvas(64, 64);
    g.fillStyle = color;
    g.fillRect(0, 0, 64, 64);
    const accent = new THREE.Color(color).getHSL({ h: 0, s: 0, l: 0 }).l > 0.5 ? "#2A1B3D" : "#F5D27A";
    g.fillStyle = accent;
    for (const [x, y] of [[16, 16], [48, 48], [48, 16], [16, 48]]) {
      g.beginPath();
      g.arc(x, y, 9, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = color;
    for (const [x, y] of [[16, 16], [48, 48], [48, 16], [16, 48]]) {
      g.beginPath();
      g.arc(x, y, 5, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#E5533D";
    for (const [x, y] of [[32, 32], [0, 32], [32, 0], [64, 32], [32, 64], [0, 0], [64, 64], [0, 64], [64, 0]]) {
      g.beginPath();
      g.moveTo(x, y - 5);
      g.lineTo(x + 5, y);
      g.lineTo(x, y + 5);
      g.lineTo(x - 5, y);
      g.fill();
    }
    const t = toTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1.5, 1.5);
    return t;
  });
}

/** Football jersey: base colour with white side stripes. */
export function jerseyTexture(color: string) {
  return cached(`jersey:${color}`, () => {
    const [c, g] = makeCanvas(64, 64);
    g.fillStyle = color;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#FFFFFF";
    g.fillRect(4, 0, 6, 64);
    g.fillRect(54, 0, 6, 64);
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.font = "900 26px Arial Black, sans-serif";
    g.textAlign = "center";
    g.fillText("10", 32, 42);
    return toTexture(c);
  });
}
