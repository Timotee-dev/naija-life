// THE PEOPLE OF YABA. Each NPC has a look, a daily routine, and things to say.
// Relationship goes 0 → 100: stranger (0–19), known (20–49), friend (50–79), close friend (80+).

import type { Appearance } from "../types";
import { defaultAppearance } from "./appearance";

export interface NpcDef {
  id: string;
  name: string;
  role: string;
  appearance: Appearance;
  /** Where they stand at this weekday (0 = Monday) and hour. null = indoors, not visible. */
  schedule: (weekday: number, hour: number) => [number, number] | null;
  greet: { stranger: string[]; known: string[]; friend: string[] };
  gist: string[];
  advice: string;
}

const look = (gender: "male" | "female", o: Partial<Appearance>): Appearance => ({ ...defaultAppearance(gender), ...o });
const between = (h: number, a: number, b: number) => h >= a && h < b;

export const NPCS: NpcDef[] = [
  {
    id: "mama_nkechi",
    name: "Mama Nkechi",
    role: "Buka owner",
    appearance: look("female", { skin: "#6B4226", hair: "bald", accessory: "gele", top: "blouse", topColor: "#B5371F", bottom: "skirt", bottomColor: "#1F4E79", build: 1.2, height: 0.95 }),
    schedule: (_w, h) => (between(h, 7, 21) ? [1.9, 10] : null),
    greet: {
      stranger: ["Welcome, my pikin. You want chop?", "Fine boy, fine girl. Come and buy food."],
      known: ["{name}! You don come again. Amala dey hot today.", "My customer! How your side?"],
      friend: ["{name}, my person! I kept the biggest meat for you.", "Ehen, {name}. Sit down, I know your order."],
    },
    gist: [
      "My daughter just finished secondary school. She wants to read Medicine. Na money o.",
      "Pepper price don double since last month. I no fit increase price, customers go run.",
      "Light no dey since morning. Na gen I dey use cook stew.",
    ],
    advice: "If your hunger dey low, your health go start to drop. Chop well, my pikin. And if we become friends, I go dash you discount.",
  },
  {
    id: "tunde",
    name: "Tunde",
    role: "Student, your padi",
    appearance: look("male", { skin: "#8D5A36", hair: "afro", top: "jersey", topColor: "#1F4E79", bottom: "shorts", bottomColor: "#1E1E1E", accessory: "none" }),
    schedule: (w, h) => {
      if (w < 5) {
        if (between(h, 8, 13)) return [-67.8, -14];
        if (between(h, 13, 17)) return [2.2, -13];
        if (between(h, 17, 22)) return [-52, 86.5];
        return null;
      }
      if (between(h, 10, 15)) return [18.6, 12];
      if (between(h, 15, 19)) return [-74, 68];
      if (between(h, 19, 23)) return [-52, 86.5];
      return null;
    },
    greet: {
      stranger: ["Hey, I think I've seen you around campus."],
      known: ["{name}! How far? You do the assignment?", "Guy/babe! Where you dey since?"],
      friend: ["My G {name}! Today na today.", "{name}! Abeg lend me your charger, I go return am."],
    },
    gist: [
      "ASUU wan strike again o. If dem strike, I'm going to learn data science.",
      "That girl in 300 level finally replied my message. Na 'lol' she send.",
      "Arsenal go win league this year. Write it down.",
    ],
    advice: "Lectures are 9 to 1. Miss too many and the course rep will report you. Library is free if you want to level up your coding.",
  },
  {
    id: "chiamaka",
    name: "Chiamaka",
    role: "Software developer",
    appearance: look("female", { skin: "#B57A4F", hair: "bun", top: "tee", topColor: "#1E1E1E", bottom: "trousers", bottomColor: "#1F4E79", accessory: "glasses" }),
    schedule: (w, h) => {
      if (w > 5) return null;
      if (between(h, 13, 14)) return [2.4, 3.2];
      if (between(h, 9, 19)) return [2.1, -26];
      return null;
    },
    greet: {
      stranger: ["Hi. Sorry, I'm on a call in five minutes."],
      known: ["{name}, how's the coding going?", "Hey {name}. Hub wifi is fast today."],
      friend: ["{name}! I have a client who needs someone. I'll send your way.", "My favourite junior dev!"],
    },
    gist: [
      "Got paid in dollars for the first time last month. I just stared at the alert.",
      "Everybody wants to build an app. Nobody wants to write tests.",
      "NEPA took light during my demo once. Never again: I live at the hub now.",
    ],
    advice: "Freelance pay goes up with your coding level. Read at the library, watch tutorials here, and buy a laptop when you can, so you can work from home.",
  },
  {
    id: "mallam_musa",
    name: "Mallam Musa",
    role: "Suya seller",
    appearance: look("male", { skin: "#5A3820", hair: "lowcut", top: "kaftan", topColor: "#E7E2D6", bottom: "trousers", bottomColor: "#E7E2D6", accessory: "cap", beard: true, build: 1.05 }),
    schedule: (_w, h) => (h >= 18 || h < 2 ? [21.8, -44.2] : null),
    greet: {
      stranger: ["Sannu! Suya dey, fresh one.", "Welcome, my friend."],
      known: ["Ah, {name}! You don come for your suya."],
      friend: ["{name}, my brother/sister! I go add extra onions for you."],
    },
    gist: [
      "Cow price don go up. But Musa suya never reduce size.",
      "I have been selling suya on this corner for eleven years.",
      "My son is in Kano, he wants to be a pilot.",
    ],
    advice: "I only open at night, from 6 till 2 in the morning. Suya at night, happiness in the morning.",
  },
  {
    id: "iya_basira",
    name: "Iya Basira",
    role: "Market trader",
    appearance: look("female", { skin: "#4F311C", hair: "bald", accessory: "gele", top: "ankara", topColor: "#F5B700", bottom: "skirt", bottomColor: "#0B5D3B", build: 1.15 }),
    schedule: (w, h) => (w !== 6 && between(h, 7, 19) ? [-20, -64.8] : null),
    greet: {
      stranger: ["Customer! Come and see fine clothes.", "What are you buying? I will give you good price."],
      known: ["{name}, my customer! Ehen, what do you want today?"],
      friend: ["{name}! For you, I go reduce price before you even price am."],
    },
    gist: [
      "Saturday is the best market day. Everybody comes out.",
      "Customers want first-class quality for last-class price.",
      "The council people came to collect levy again. Third time this month.",
    ],
    advice: "Always bargain. If you price am well, I go reduce. If you price am too low, I go vex. And friends get discount.",
  },
  {
    id: "kunle",
    name: "Kunle",
    role: "Danfo conductor",
    appearance: look("male", { skin: "#6B4226", hair: "lowcut", top: "tee", topColor: "#F5B700", bottom: "trousers", bottomColor: "#1E1E1E", accessory: "cap", build: 0.9 }),
    schedule: (_w, h) => (between(h, 6, 22) ? [17.9, 2.2] : null),
    greet: {
      stranger: ["Yaba! Sabo! Akoka! Enter with your change!", "Oya, oya! One chance! Danfo dey go!"],
      known: ["{name}! Enter, I go find you seat for front."],
      friend: ["{name}, my person! No need for change today, I trust you."],
    },
    gist: [
      "Driver say fuel don cost again. Na why fare go up.",
      "Yesterday one man pay with ₦1,000 for ₦300 fare. Change no dey.",
      "I go buy my own danfo one day. Na plan be that.",
    ],
    advice: "Danfo na ₦300, cash only, and it only goes to bus stops. Keke cost more but drops you anywhere. Ride app is fastest, but na bank money.",
  },
  {
    id: "pastor_femi",
    name: "Pastor Femi",
    role: "Pastor, Grace Assembly",
    appearance: look("male", { skin: "#8D5A36", hair: "lowcut", top: "kaftan", topColor: "#1F4E79", bottom: "trousers", bottomColor: "#1F4E79", accessory: "glasses", beard: true }),
    schedule: (_w, h) => (between(h, 8, 18) ? [1.9, 80] : null),
    greet: {
      stranger: ["You are welcome, my child. God bless you.", "Welcome! First time here?"],
      known: ["Brother/Sister {name}! Good to see you."],
      friend: ["{name}! The choir needs a new member, you know."],
    },
    gist: [
      "The generator for the church needs servicing. We are praying about it.",
      "Youth fellowship is on Wednesday evening. Bring a friend.",
      "Lagos is hard. That's why we must look after one another.",
    ],
    advice: "Sunday service is in the morning, fellowship is Wednesday evening. Your social life matters as much as your money.",
  },
  {
    id: "alhaji_lateef",
    name: "Alhaji Lateef",
    role: "Estate agent",
    appearance: look("male", { skin: "#5A3820", hair: "lowcut", top: "kaftan", topColor: "#0B5D3B", bottom: "trousers", bottomColor: "#0B5D3B", accessory: "cap", beard: true, build: 1.18 }),
    schedule: (w, h) => (w < 6 && between(h, 9, 17) ? [-51.9, 61.5] : null),
    greet: {
      stranger: ["You want house? I have the best properties in Yaba.", "Welcome, welcome. Agency fee is not negotiable."],
      known: ["{name}! You don ready to upgrade?"],
      friend: ["My friend {name}! For you, I'll find something nice."],
    },
    gist: [
      "Landlords want two years' rent upfront now. Who has that kind of money?",
      "Self-con in Sabo Court is moving fast. Students and young workers love it.",
      "Lekki is too expensive. Yaba is where the life is.",
    ],
    advice: "Pay your rent on time. Three days late and the landlord will throw your load outside. You can pay at home, here, or on your bank app.",
  },
  {
    id: "bisi",
    name: "Bisi",
    role: "Hairstylist & barber",
    appearance: look("female", { skin: "#B57A4F", hair: "braids", hairColor: "#7A1F2B", top: "tee", topColor: "#E46A8C", bottom: "trousers", bottomColor: "#1E1E1E" }),
    schedule: (w, h) => (w !== 6 && between(h, 8, 21) ? [-2.4, -64.6] : null),
    greet: {
      stranger: ["Your hair needs help. Come in.", "Barbing or braiding?"],
      known: ["{name}! Your line is fading, come and fix it."],
      friend: ["{name}, my client! Free gist with every haircut."],
    },
    gist: [
      "I want to open a second branch in Lekki. Lekki people pay three times the price.",
      "NEPA took light during a client's relaxer once. Never forget.",
      "Everybody wants braids for December.",
    ],
    advice: "A fresh look makes you happier. And a shape-up is cheap if you keep it regular.",
  },
  {
    id: "emeka",
    name: "Emeka",
    role: "Gadget seller",
    appearance: look("male", { skin: "#8D5A36", hair: "lowcut", top: "tee", topColor: "#3FA7A0", bottom: "trousers", bottomColor: "#1F4E79", accessory: "chain" }),
    schedule: (w, h) => (w !== 6 && between(h, 9, 19) ? [18.4, 54] : null),
    greet: {
      stranger: ["Laptop? Phone? Generator? I get am.", "Customer, wetin you dey find?"],
      known: ["{name}! Still saving for that laptop?"],
      friend: ["{name}, my guy! For you, I go remove small from price."],
    },
    gist: [
      "Dollar rate is killing gadget business. Prices change every week.",
      "A generator is the best investment in Lagos. Trust me.",
      "One customer returned a phone because 'it was too smart'.",
    ],
    advice: "A laptop lets you freelance from home. A generator keeps your light on when NEPA goes. Buy fuel at the market.",
  },
  {
    id: "seyi",
    name: "Seyi",
    role: "Footballer",
    appearance: look("male", { skin: "#4F311C", hair: "dreads", top: "jersey", topColor: "#0B5D3B", bottom: "shorts", bottomColor: "#F2F2F2", build: 1.1, height: 1.06 }),
    schedule: (_w, h) => {
      if (between(h, 15, 19)) return [-74.5, 75];
      if (between(h, 10, 15)) return [18.6, 13.5];
      return null;
    },
    greet: {
      stranger: ["You play ball? Come to Akoka field by 4."],
      known: ["{name}! You dey come field today?"],
      friend: ["{name}! My striker partner!"],
    },
    gist: [
      "A scout from a Lagos club is coming to watch us next month.",
      "I train every day. Football is my way out.",
      "If I make it, I'm buying my mum a house in Surulere.",
    ],
    advice: "Football keeps you fit. Fitness helps you work longer without getting tired.",
  },
];

export const NPC_BY_ID: Record<string, NpcDef> = Object.fromEntries(NPCS.map((n) => [n.id, n]));

export function tierOf(rel: number): "stranger" | "known" | "friend" {
  return rel >= 50 ? "friend" : rel >= 20 ? "known" : "stranger";
}

export function tierLabel(rel: number) {
  return rel >= 80 ? "Close friend" : rel >= 50 ? "Friend" : rel >= 20 ? "Known" : "Stranger";
}

/** Lines that random passers-by say. */
export const PED_LINES = [
  "Good morning o!",
  "Abeg, I dey rush.",
  "Have you seen how fuel price has gone up?",
  "This Lagos sun is not here to play.",
  "NEPA must hear word today.",
  "Na wa for this traffic.",
  "Do you know where Yaba Market is? Never mind, I see it.",
  "God when?",
  "Nice outfit! Where did you buy it?",
  "Japa is the plan. Lagos is the training ground.",
];

export const PED_NAMES = ["Passer-by", "Student", "Trader", "Office worker", "Hawker", "Okada rider (off duty)"];
