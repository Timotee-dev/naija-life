// THE LIFE SIMULATION: needs, money, time, and the daily events of Yaba life.
// Every function here takes the Sim and changes it. No React, no 3D.

import { START_HOUR } from "../constants";
import { BACKGROUNDS, HOMES } from "../data/backgrounds";
import type {
  Account, Appearance, BackgroundId, ItemId, MessageChoice, NeedKey, PayMode, Sim, SimMode, SkillKey, ThreadId,
} from "../types";
import { clamp, dayOf, hourOf, naira, pick, rand, weekdayOf } from "../utils";

// ---------- Creating a new life ----------
export function createSim(name: string, appearance: Appearance, background: BackgroundId): Sim {
  const bg = BACKGROUNDS[background];
  const s: Sim = {
    version: 1,
    name,
    appearance,
    background,
    time: START_HOUR * 60,
    needs: { health: 92, hunger: 70, energy: 85, happiness: 70, hygiene: 75, social: 60 },
    cash: bg.cash,
    bank: bg.bank,
    txs: [],
    inventory: { water: 3, meatroll: 1 },
    home: bg.home,
    rentPaidUntil: 7,
    skills: { coding: 0, hustle: 0, fitness: 0, ...bg.skills },
    relations: { ...bg.relations },
    messages: [],
    nextMsgId: 1,
    nepa: true,
    nepaNext: START_HOUR * 60 + rand(180, 420),
    fuelPrice: 980,
    genUntil: 0,
    pos: [0, 0],
    yaw: 0,
    waypoint: null,
    flags: { lastDay: 0 },
  };
  msg(s, "family", "Mummy", `Welcome to Yaba, ${name}. Don't forget to eat o. We are praying for you.`);
  const intro: Record<BackgroundId, [ThreadId, string, string]> = {
    student: ["school", "Course Rep", "Lectures are 9 AM – 1 PM, Monday to Friday. Lecturer is taking attendance this semester o."],
    graduate: ["chiamaka", "Chiamaka", "Saw your CV. The tech hub on Herbert Macaulay pays freelancers. Come through when you're ready."],
    entrepreneur: ["stall", "Iya Basira", "Your stall in Yaba Market is waiting. Saturday is when market really moves."],
    worker: ["work", "Mr. Okafor (Yaba Mart)", "Shifts are Monday to Saturday. Clock in between 8 and 10 AM. Don't be late."],
    unemployed: ["uncle", "Uncle Dayo", "You can stay on the couch. Help me with errands sometimes, and greet your aunty well."],
  };
  const [t, from, text] = intro[background];
  msg(s, t, from, text);
  return s;
}

// ---------- Small helpers used everywhere ----------
export const today = (s: Sim) => dayOf(s.time);
export const hourNow = (s: Sim) => hourOf(s.time);
export const weekdayNow = (s: Sim) => weekdayOf(s.time);

export function add(s: Sim, k: NeedKey, v: number) {
  s.needs[k] = clamp(s.needs[k] + v, 0, 100);
}
export function addSkill(s: Sim, k: SkillKey, v: number) {
  s.skills[k] = clamp(s.skills[k] + v, 0, 10);
}
export function relOf(s: Sim, npc: string) {
  return s.relations[npc] ?? 0;
}
export function rel(s: Sim, npc: string, v: number) {
  s.relations[npc] = clamp(relOf(s, npc) + v, 0, 100);
}
export function flag(s: Sim, k: string, def = -99) {
  return s.flags[k] ?? def;
}
export function setFlag(s: Sim, k: string, v: number) {
  s.flags[k] = v;
}
export function itemCount(s: Sim, id: ItemId) {
  return s.inventory[id] ?? 0;
}
export function hasItem(s: Sim, id: ItemId) {
  return itemCount(s, id) > 0;
}
export function addItem(s: Sim, id: ItemId, n = 1) {
  const v = itemCount(s, id) + n;
  if (v <= 0) delete s.inventory[id];
  else s.inventory[id] = v;
}
export const powered = (s: Sim) => s.nepa || s.genUntil > s.time;

// ---------- Money ----------
export function canPay(s: Sim, amount: number, mode: PayMode): boolean {
  if (mode === "cash") return s.cash >= amount;
  if (mode === "bank") return s.bank >= amount;
  return s.cash >= amount || s.bank >= amount;
}

/** Takes the money and records it. Returns false (and changes nothing) if you can't afford it. */
export function spend(s: Sim, amount: number, mode: PayMode, label: string): boolean {
  if (amount <= 0) return true;
  if (!canPay(s, amount, mode)) return false;
  const account: Account = mode === "cash" || (mode === "any" && s.cash >= amount) ? "cash" : "bank";
  if (account === "cash") s.cash -= amount;
  else s.bank -= amount;
  record(s, label, -amount, account);
  if (account === "bank" && amount >= 10000) {
    msg(s, "bank", "NaijaTrust Alert", `Debit Alert! NGN ${amount.toLocaleString()}.00 | ${label} | Bal: NGN ${s.bank.toLocaleString()}.00`);
  }
  return true;
}

export function earn(s: Sim, amount: number, account: Account, label: string) {
  if (account === "cash") s.cash += amount;
  else s.bank += amount;
  record(s, label, amount, account);
  if (account === "bank" && amount >= 5000) {
    msg(s, "bank", "NaijaTrust Alert", `Credit Alert! NGN ${amount.toLocaleString()}.00 | ${label} | Bal: NGN ${s.bank.toLocaleString()}.00`);
  }
}

function record(s: Sim, label: string, amount: number, account: Account) {
  s.txs.unshift({ time: s.time, label, amount, account });
  if (s.txs.length > 60) s.txs.length = 60;
}

// ---------- Messages ----------
export function msg(s: Sim, thread: ThreadId, from: string, text: string, choices?: MessageChoice[], mine = false) {
  s.messages.push({ id: s.nextMsgId++, thread, from, text, time: s.time, read: mine, choices, mine });
  if (s.messages.length > 140) {
    const i = s.messages.findIndex((m) => !m.choices || m.resolved);
    s.messages.splice(i >= 0 ? i : 0, 1);
  }
}

// ---------- Rent ----------
export function rentStatus(s: Sim): string {
  const rent = HOMES[s.home].rent;
  if (rent === 0) return "No rent: you stay with Uncle Dayo.";
  const left = s.rentPaidUntil - today(s);
  if (left > 1) return `${naira(rent)} due in ${left} days (Day ${s.rentPaidUntil + 1}).`;
  if (left === 1) return `${naira(rent)} due tomorrow.`;
  if (left === 0) return `${naira(rent)} due today.`;
  return `${naira(rent)} overdue by ${-left} day${left === -1 ? "" : "s"}. Pay before day ${s.rentPaidUntil + 4} or you'll be evicted.`;
}

/** Pays one week of rent from your bank account. Returns an error message, or null if it worked. */
export function payRent(s: Sim): string | null {
  const rent = HOMES[s.home].rent;
  if (rent === 0) return "You don't pay rent at Uncle Dayo's.";
  if (s.rentPaidUntil - today(s) > 7) return "You've already paid ahead. Landlord says thank you.";
  if (!spend(s, rent, "bank", `Rent: ${HOMES[s.home].short}`)) return `Not enough in your bank account. Rent is ${naira(rent)}.`;
  s.rentPaidUntil += 7;
  msg(s, "landlord", HOMES[s.home].landlord, `Received ${naira(rent)}. Your rent is now paid until Day ${s.rentPaidUntil + 1}. God bless you.`);
  return null;
}

// ---------- Time and needs ----------
const DRAIN: Record<"hunger" | "energy" | "hygiene" | "social", number> = {
  hunger: 0.07, // per game minute: ~100 → 30 over 16 hours
  energy: 0.055,
  hygiene: 0.035,
  social: 0.025,
};
const MODE_FACTORS: Record<SimMode, Record<keyof typeof DRAIN, number>> = {
  normal: { hunger: 1, energy: 1, hygiene: 1, social: 1 },
  work: { hunger: 1.3, energy: 1.6, hygiene: 1.4, social: 0.6 },
  rest: { hunger: 0.8, energy: 0.3, hygiene: 0.7, social: 0.9 },
  sleep: { hunger: 0.35, energy: 0, hygiene: 0.3, social: 0.2 },
};

function drain(s: Sim, minutes: number, mode: SimMode) {
  const f = MODE_FACTORS[mode];
  const fitnessHelp = mode === "work" ? 1 - s.skills.fitness * 0.04 : 1;
  add(s, "hunger", -DRAIN.hunger * f.hunger * minutes);
  add(s, "energy", -DRAIN.energy * f.energy * minutes * fitnessHelp);
  add(s, "hygiene", -DRAIN.hygiene * f.hygiene * minutes);
  add(s, "social", -DRAIN.social * f.social * minutes);
  const n = s.needs;
  // Health: drops slowly when starving or exhausted, otherwise heals slowly.
  if (n.hunger < 10 || n.energy < 5) add(s, "health", -0.03 * minutes);
  else add(s, "health", 0.012 * minutes);
  // Happiness drifts toward how well your other needs are met.
  const target = ((n.hunger + n.energy + n.hygiene + n.social) / 4) * 0.8 + 20;
  n.happiness = clamp(n.happiness + (target - n.happiness) * Math.min(1, minutes * 0.004), 0, 100);
}

/** Moves the clock forward. Needs drain and daily events fire along the way. */
export function passTime(s: Sim, minutes: number, mode: SimMode, notes: string[]) {
  let left = minutes;
  while (left > 0) {
    const step = Math.min(15, left);
    s.time += step;
    left -= step;
    drain(s, step, mode);
    checkEvents(s, notes);
  }
}

function checkEvents(s: Sim, notes: string[]) {
  const d = today(s);
  while (flag(s, "lastDay", 0) < d) {
    const next = flag(s, "lastDay", 0) + 1;
    setFlag(s, "lastDay", next);
    newDay(s, next, notes);
  }
  if (s.time >= s.nepaNext) {
    s.nepa = !s.nepa;
    s.nepaNext = s.time + (s.nepa ? rand(360, 840) : rand(90, 300));
    notes.push(s.nepa ? "UP NEPA! Light don come." : "NEPA don take light.");
  }
  if (s.genUntil && s.time >= s.genUntil) {
    s.genUntil = 0;
    if (!s.nepa) notes.push("Your generator ran out of fuel.");
  }
}

const FAMILY_LINES: [string, string][] = [
  ["Mummy", "Good morning. Have you eaten? Don't let Lagos finish you."],
  ["Daddy", "Remember the son/daughter of whom you are."],
  ["Aunty Bose", "Who is coming home for December? I'm cooking."],
  ["Uncle Gbenga", "Forwarded as received: Drinking cold water after 6 PM is very dangerous. Share to 10 people."],
  ["Mummy", "Your cousin Tobi got admission. We thank God."],
  ["Daddy", "How is work? Don't follow bad friends."],
  ["Aunty Bose", "Prayer request: let us pray for journey mercies for everyone travelling this weekend."],
  ["Sister Kemi", "Abeg who has Netflix password?"],
];

const FAMILY_ASKS: [string, string, number][] = [
  ["Mummy", "The roof is leaking again. Can you send ₦5,000 for the carpenter?", 5000],
  ["Daddy", "The car battery died. Assist with ₦8,000 if you can.", 8000],
  ["Sister Kemi", "Abeg send me ₦3,000 for data. School portal is open.", 3000],
  ["Mummy", "Grandma's birthday is Saturday. Contribute ₦4,000 for the cake.", 4000],
];

function newDay(s: Sim, d: number, notes: string[]) {
  const wd = d % 7;
  const prev = d - 1;
  const prevWd = prev % 7;

  // Fuel price moves every day.
  const old = s.fuelPrice;
  s.fuelPrice = Math.round(clamp(s.fuelPrice * rand(0.95, 1.09), 750, 1700));
  if (Math.abs(s.fuelPrice - old) / old > 0.05) notes.push(`Fuel price is now ${naira(s.fuelPrice)} per litre.`);

  // Background responsibilities from yesterday.
  if (s.background === "worker" && !flag(s, "fired", 0) && prevWd < 6 && flag(s, "lastShiftDay") !== prev) {
    const missed = flag(s, "missedShifts", 0) + 1;
    setFlag(s, "missedShifts", missed);
    if (missed >= 3) {
      setFlag(s, "fired", 1);
      msg(s, "work", "Mr. Okafor (Yaba Mart)", "You have missed 3 shifts. Don't bother coming back. You're fired.");
      add(s, "happiness", -15);
      notes.push("You've been fired from Yaba Mart.");
    } else {
      msg(s, "work", "Mr. Okafor (Yaba Mart)", `You didn't show up yesterday. That's ${missed} missed shift${missed > 1 ? "s" : ""}. Three and you're out.`);
      add(s, "happiness", -4);
    }
  }
  if (s.background === "student" && prevWd < 5 && flag(s, "lastLectureDay") !== prev) {
    msg(s, "school", "Course Rep", pick([
      "Lecturer took attendance today o. Your name no dey.",
      "Where were you? We did a surprise test.",
      "Lecturer said anybody who misses again will see carryover.",
    ]));
    add(s, "happiness", -3);
  }
  if (s.home === "uncle" && d - flag(s, "lastErrandDay", 0) >= 3 && d % 3 === 0) {
    msg(s, "uncle", "Uncle Dayo", "This house is not a hotel o. Run errands when I ask.");
    add(s, "happiness", -4);
  }

  // Student allowance every Monday.
  if (s.background === "student" && wd === 0) earn(s, 20000, "bank", "Allowance from home");

  // Family group chat.
  const [from, text] = pick(FAMILY_LINES);
  msg(s, "family", from, text.replace("son/daughter", s.appearance.gender === "male" ? "son" : "daughter"));
  const asksEvery = s.background === "graduate" ? 2 : 3;
  if (d % asksEvery === 0) {
    const pending = s.messages.some((m) => m.thread === "family" && m.choices && !m.resolved);
    if (!pending) {
      const [f, t, amt] = pick(FAMILY_ASKS);
      msg(s, "family", f, t, [
        { label: `Send ${naira(amt)}`, money: -amt, happiness: 5, reply: "Sent. Please confirm." },
        { label: "I'll send later", happiness: -3, reply: "I'll send something by weekend, please." },
      ]);
      notes.push(`${f} needs ${naira(amt)}. Check the family group.`);
    }
  }

  // Rent.
  const rent = HOMES[s.home].rent;
  if (rent > 0) {
    const landlord = HOMES[s.home].landlord;
    if (d === s.rentPaidUntil - 1) msg(s, "landlord", landlord, `Good morning. Rent of ${naira(rent)} is due tomorrow. Pay at Alhaji Properties, at home, or on the bank app.`);
    else if (d === s.rentPaidUntil) {
      msg(s, "landlord", landlord, `Rent of ${naira(rent)} is due TODAY. I'm a patient person but not too patient.`);
      notes.push("Rent is due today.");
    } else if (d === s.rentPaidUntil + 2) {
      msg(s, "landlord", landlord, "Final warning. Pay by tomorrow or pack your load.");
      notes.push("Final rent warning! Pay today.");
    } else if (d >= s.rentPaidUntil + 3) {
      msg(s, "landlord", landlord, "You have been evicted. Your things are with the security man.");
      msg(s, "uncle", "Uncle Dayo", "I heard what happened. Come and stay on my couch for now.");
      s.home = "uncle";
      add(s, "happiness", -20);
      notes.push("Evicted! Uncle Dayo is letting you stay on his couch.");
    }
  }

  // Weekend plans with Tunde.
  if (wd === 4 || wd === 5) {
    msg(s, "tunde", "Tunde", pick([
      "Big match at Goal Zone this evening. You dey come?",
      "Ball at Akoka field around 4. Bring your boots.",
      "Mallam Musa's suya tonight? My treat. (I'm lying, you'll pay.)",
    ]));
  }
  if (s.background === "entrepreneur" && wd === 5) {
    msg(s, "stall", "Iya Basira", "It's Saturday! Market is full. Open your stall today.");
  }
}
