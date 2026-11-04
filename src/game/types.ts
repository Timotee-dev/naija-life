// Every piece of data in NAIJA LIFE is described here.
// If you want to know what the game remembers about you, read `Sim` at the bottom.

export type Gender = "male" | "female";
export type HairStyle = "lowcut" | "afro" | "bald" | "braids" | "bun" | "dreads";
export type FaceStyle = "calm" | "smiley" | "serious";
export type TopStyle = "tee" | "ankara" | "jersey" | "kaftan" | "blouse";
export type BottomStyle = "trousers" | "shorts" | "skirt";
export type Accessory = "none" | "glasses" | "cap" | "chain" | "gele";

/** How a person looks. Used for the player AND every NPC. */
export interface Appearance {
  gender: Gender;
  skin: string;
  face: FaceStyle;
  hair: HairStyle;
  hairColor: string;
  beard: boolean;
  top: TopStyle;
  topColor: string;
  bottom: BottomStyle;
  bottomColor: string;
  shoes: string;
  accessory: Accessory;
  height: number; // 0.9 – 1.1
  build: number; // 0.85 – 1.2
}

export type BackgroundId = "student" | "graduate" | "entrepreneur" | "worker" | "unemployed";
export type NeedKey = "health" | "hunger" | "energy" | "happiness" | "hygiene" | "social";
export type Needs = Record<NeedKey, number>;
export type HomeId = "uncle" | "hostel" | "room" | "selfcon";
export type ItemId = "bread" | "meatroll" | "noodles" | "water" | "chips" | "fuel" | "laptop" | "generator";
export type SkillKey = "coding" | "hustle" | "fitness";
export type ThreadId = "family" | "landlord" | "work" | "school" | "uncle" | "tunde" | "chiamaka" | "bank" | "stall";
export type Account = "cash" | "bank";
/** "any" = pay cash if you have enough, otherwise by bank transfer. */
export type PayMode = "cash" | "bank" | "any";
/** Changes how fast your needs drain while time passes. */
export type SimMode = "normal" | "work" | "sleep" | "rest";

export interface Tx {
  time: number;
  label: string;
  amount: number; // positive = money in, negative = money out
  account: Account;
}

export interface MessageChoice {
  label: string;
  money?: number; // negative = you send money (from bank)
  happiness?: number;
  relation?: { npc: string; amount: number };
  reply: string;
}

export interface Message {
  id: number;
  thread: ThreadId;
  from: string;
  text: string;
  time: number;
  mine?: boolean;
  read: boolean;
  choices?: MessageChoice[];
  resolved?: boolean;
}

/** The whole saved game. Plain data only, so it can go straight into JSON. */
export interface Sim {
  version: 1;
  name: string;
  appearance: Appearance;
  background: BackgroundId;
  time: number; // game minutes since Day 1, 00:00 (Day 1 is a Monday)
  needs: Needs;
  cash: number;
  bank: number;
  txs: Tx[];
  inventory: Partial<Record<ItemId, number>>;
  home: HomeId;
  rentPaidUntil: number; // day index when the next rent is due
  skills: Record<SkillKey, number>;
  relations: Record<string, number>;
  messages: Message[];
  nextMsgId: number;
  nepa: boolean; // is public power on?
  nepaNext: number; // when NEPA changes next
  fuelPrice: number; // ₦ per litre, changes daily
  genUntil: number; // your home generator runs until this time
  pos: [number, number];
  yaw: number;
  waypoint: { x: number; z: number; label: string } | null;
  flags: Record<string, number>;
}
