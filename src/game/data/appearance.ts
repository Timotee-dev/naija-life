import type { Accessory, Appearance, BottomStyle, FaceStyle, Gender, HairStyle, TopStyle } from "../types";

export const SKIN_TONES = ["#F0C8A2", "#D9A47A", "#B57A4F", "#8D5A36", "#6B4226", "#4F311C", "#3A2213"];
export const HAIR_COLORS = ["#121212", "#2B1A10", "#5A3A22", "#8A5A2B", "#C9A15A", "#7A1F2B"];
export const CLOTH_COLORS = [
  "#0B5D3B", "#F5B700", "#B5371F", "#1F4E79", "#6A3FA0",
  "#E7E2D6", "#1E1E1E", "#E46A8C", "#3FA7A0", "#8C6D3F",
];
export const SHOE_COLORS = ["#1E1E1E", "#F2F2F2", "#7A4B26", "#B5371F", "#1F4E79"];

export const HAIR_LABELS: Record<HairStyle, string> = {
  lowcut: "Low cut", afro: "Afro", bald: "Clean shave", braids: "Braids", bun: "Bun", dreads: "Dreads",
};
export const FACE_LABELS: Record<FaceStyle, string> = { calm: "Calm", smiley: "Smiley", serious: "Serious" };
export const TOP_LABELS: Record<TopStyle, string> = {
  tee: "T-shirt", ankara: "Ankara shirt", jersey: "Football jersey", kaftan: "Kaftan", blouse: "Blouse",
};
export const BOTTOM_LABELS: Record<BottomStyle, string> = { trousers: "Trousers", shorts: "Shorts", skirt: "Skirt" };
export const ACCESSORY_LABELS: Record<Accessory, string> = {
  none: "None", glasses: "Glasses", cap: "Face cap", chain: "Gold chain", gele: "Gele (head tie)",
};

export const HAIRS: HairStyle[] = ["lowcut", "afro", "bald", "braids", "bun", "dreads"];
export const FACES: FaceStyle[] = ["calm", "smiley", "serious"];
export const TOPS: TopStyle[] = ["tee", "ankara", "jersey", "kaftan", "blouse"];
export const BOTTOMS: BottomStyle[] = ["trousers", "shorts", "skirt"];
export const ACCESSORIES: Accessory[] = ["none", "glasses", "cap", "chain", "gele"];

export function defaultAppearance(gender: Gender): Appearance {
  return gender === "male"
    ? {
        gender, skin: SKIN_TONES[4], face: "smiley", hair: "lowcut", hairColor: HAIR_COLORS[0], beard: false,
        top: "ankara", topColor: CLOTH_COLORS[0], bottom: "trousers", bottomColor: CLOTH_COLORS[6],
        shoes: SHOE_COLORS[1], accessory: "none", height: 1, build: 1,
      }
    : {
        gender, skin: SKIN_TONES[3], face: "smiley", hair: "braids", hairColor: HAIR_COLORS[0], beard: false,
        top: "blouse", topColor: CLOTH_COLORS[1], bottom: "skirt", bottomColor: CLOTH_COLORS[3],
        shoes: SHOE_COLORS[0], accessory: "none", height: 0.96, build: 0.95,
      };
}

export function randomAppearance(rng: () => number = Math.random, gender?: Gender): Appearance {
  const p = <T,>(a: readonly T[]) => a[Math.floor(rng() * a.length)];
  const g: Gender = gender ?? (rng() < 0.5 ? "male" : "female");
  const male = g === "male";
  return {
    gender: g,
    skin: p(SKIN_TONES.slice(1)),
    face: p(FACES),
    hair: male ? p<HairStyle>(["lowcut", "lowcut", "afro", "bald", "dreads"]) : p<HairStyle>(["braids", "braids", "bun", "afro", "lowcut"]),
    hairColor: rng() < 0.8 ? HAIR_COLORS[0] : p(HAIR_COLORS),
    beard: male && rng() < 0.35,
    top: male ? p<TopStyle>(["tee", "ankara", "jersey", "kaftan"]) : p<TopStyle>(["blouse", "ankara", "tee"]),
    topColor: p(CLOTH_COLORS),
    bottom: male ? p<BottomStyle>(["trousers", "trousers", "shorts"]) : p<BottomStyle>(["skirt", "trousers", "skirt"]),
    bottomColor: p(CLOTH_COLORS),
    shoes: p(SHOE_COLORS),
    accessory: male ? p<Accessory>(["none", "none", "cap", "glasses", "chain"]) : p<Accessory>(["none", "gele", "glasses", "none"]),
    height: 0.92 + rng() * 0.16,
    build: 0.88 + rng() * 0.28,
  };
}
