import type { BackgroundId, HomeId, SkillKey } from "../types";

export interface BackgroundDef {
  name: string;
  blurb: string;
  cash: number;
  bank: number;
  home: HomeId;
  skills: Partial<Record<SkillKey, number>>;
  relations: Record<string, number>;
  perks: string[];
}

export const BACKGROUNDS: Record<BackgroundId, BackgroundDef> = {
  student: {
    name: "University student",
    blurb: "Second year at Akoka University. Allowance lands every Monday.",
    cash: 15000,
    bank: 35000,
    home: "hostel",
    skills: { coding: 1, fitness: 1 },
    relations: { tunde: 45 },
    perks: ["Lectures Mon–Fri, 9 AM – 1 PM", "₦20,000 allowance every Monday", "Cheapest rent: Akoka Hostel"],
  },
  graduate: {
    name: "Recent graduate",
    blurb: "Degree in hand, no job yet. You can code a little.",
    cash: 10000,
    bank: 70000,
    home: "room",
    skills: { coding: 2 },
    relations: { chiamaka: 25 },
    perks: ["Better pay for freelance work at the hub", "Family expects you to start sending money"],
  },
  entrepreneur: {
    name: "Young entrepreneur",
    blurb: "You run a phone-accessories stall in Yaba Market.",
    cash: 30000,
    bank: 120000,
    home: "selfcon",
    skills: { hustle: 2 },
    relations: { iya_basira: 40 },
    perks: ["Run your market stall any day (Saturdays pay best)", "Self-con apartment, higher rent"],
  },
  worker: {
    name: "Working-class",
    blurb: "Shift worker at Yaba Mart. Steady pay, long days.",
    cash: 12000,
    bank: 45000,
    home: "room",
    skills: { hustle: 1, fitness: 1 },
    relations: {},
    perks: ["Shifts Mon–Sat: clock in 8–10 AM, ₦9,000 per shift", "Miss 3 shifts and you're fired"],
  },
  unemployed: {
    name: "Unemployed young adult",
    blurb: "Sleeping on Uncle Dayo's couch while you find your feet.",
    cash: 6000,
    bank: 4000,
    home: "uncle",
    skills: {},
    relations: {},
    perks: ["No rent, but Uncle expects errands", "Odd jobs at the market and the buka pay daily"],
  },
};

export interface HomeDef {
  name: string;
  short: string;
  rent: number; // per game week (7 days)
  place: string;
  landlord: string;
  bath: "bucket" | "shower";
}

export const HOMES: Record<HomeId, HomeDef> = {
  uncle: { name: "Uncle Dayo's flat (couch)", short: "Uncle Dayo's flat", rent: 0, place: "home_uncle", landlord: "Uncle Dayo", bath: "bucket" },
  hostel: { name: "Akoka Hostel, Room B12", short: "Akoka Hostel", rent: 10000, place: "home_hostel", landlord: "Hostel Bursar", bath: "bucket" },
  room: { name: "Single room, No. 14 Alagomeji", short: "Alagomeji room", rent: 18000, place: "home_room", landlord: "Baba Landlord", bath: "bucket" },
  selfcon: { name: "Self-con, Sabo Court", short: "Sabo Court self-con", rent: 35000, place: "home_selfcon", landlord: "Sabo Court Estate Manager", bath: "shower" },
};
