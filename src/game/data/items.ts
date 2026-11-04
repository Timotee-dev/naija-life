import type { ItemId, NeedKey } from "../types";

export interface ItemDef {
  name: string;
  price: number;
  desc: string;
  /** What using it does. Missing = can't be "used" directly (tools, fuel). */
  use?: Partial<Record<NeedKey, number>>;
  useLabel?: string;
  homeOnly?: boolean; // e.g. noodles need your stove
  durable?: boolean; // you only ever need one
}

export const ITEMS: Record<ItemId, ItemDef> = {
  bread: { name: "Agege bread", price: 1200, desc: "Soft, sweet, heavy. Hunger +30", use: { hunger: 30, happiness: 1 }, useLabel: "Eat" },
  meatroll: { name: "Meat roll", price: 500, desc: "Snack for the road. Hunger +15", use: { hunger: 15, happiness: 2 }, useLabel: "Eat" },
  noodles: { name: "Instant noodles", price: 450, desc: "Cook at home. Hunger +40", use: { hunger: 40, happiness: 2 }, useLabel: "Cook", homeOnly: true },
  water: { name: "Pure water (sachet)", price: 50, desc: "Cold sachet water. Energy +4", use: { energy: 4, health: 1 }, useLabel: "Drink" },
  chips: { name: "Plantain chips", price: 300, desc: "Crunchy. Hunger +10, Happiness +3", use: { hunger: 10, happiness: 3 }, useLabel: "Eat" },
  fuel: { name: "Fuel (1 litre)", price: 0, desc: "Runs your generator for 8 hours" },
  laptop: { name: "Laptop", price: 280000, desc: "Freelance from home whenever there's power", durable: true },
  generator: { name: "Generator", price: 95000, desc: "Light at home when NEPA takes light", durable: true },
};
