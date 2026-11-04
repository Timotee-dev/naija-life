import type { Accessory, Appearance, BottomStyle, TopStyle } from "../types";

export interface ClothesItem {
  id: string;
  label: string;
  price: number;
  apply: Partial<Appearance>;
}

const top = (id: string, label: string, price: number, style: TopStyle, color: string): ClothesItem => ({
  id, label, price, apply: { top: style, topColor: color },
});
const bottom = (id: string, label: string, price: number, style: BottomStyle, color: string): ClothesItem => ({
  id, label, price, apply: { bottom: style, bottomColor: color },
});
const acc = (id: string, label: string, price: number, a: Accessory): ClothesItem => ({ id, label, price, apply: { accessory: a } });

/** What Iya Basira sells at Yaba Market. Prices are the "first price": always bargain. */
export const CLOTHES: ClothesItem[] = [
  top("ankara_green", "Ankara shirt (green)", 6500, "ankara", "#0B5D3B"),
  top("ankara_yellow", "Ankara shirt (yellow)", 6500, "ankara", "#F5B700"),
  top("ankara_purple", "Ankara shirt (purple)", 6500, "ankara", "#6A3FA0"),
  top("jersey_green", "Super Eagles-style jersey", 8000, "jersey", "#0B5D3B"),
  top("jersey_red", "Red club jersey", 7000, "jersey", "#B5371F"),
  top("kaftan_white", "White kaftan", 12000, "kaftan", "#E7E2D6"),
  top("kaftan_blue", "Navy kaftan", 12000, "kaftan", "#1F4E79"),
  top("tee_black", "Plain black tee", 3500, "tee", "#1E1E1E"),
  top("blouse_pink", "Pink blouse", 5000, "blouse", "#E46A8C"),
  bottom("jeans", "Blue jeans", 7000, "trousers", "#1F4E79"),
  bottom("chinos", "Brown chinos", 6000, "trousers", "#8C6D3F"),
  bottom("shorts", "Black shorts", 3000, "shorts", "#1E1E1E"),
  bottom("skirt_ankara", "Long skirt (teal)", 5500, "skirt", "#3FA7A0"),
  acc("cap", "Face cap", 2500, "cap"),
  acc("glasses", "Glasses", 4000, "glasses"),
  acc("chain", "Gold chain (very real gold)", 3000, "chain"),
  acc("gele", "Gele (head tie)", 4500, "gele"),
  acc("none", "Remove accessory", 0, "none"),
];
