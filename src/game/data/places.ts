// EVERY PLACE YOU CAN ENTER, and every action inside it.
// An action is: what it costs, how long it takes, and what it does to your life.
// Want a new activity? Add an object to a place's `actions` list. That's all.

import {
  add, addItem, addSkill, earn, flag, hasItem, hourNow, msg, powered, rel, rentStatus, setFlag, today, weekdayNow,
} from "../systems/sim";
import type { HomeId, ItemId, PayMode, Sim, SimMode } from "../types";
import { naira, pick, rand } from "../utils";
import { BACKGROUNDS, HOMES } from "./backgrounds";
import { ITEMS } from "./items";

export interface ActionDef {
  id: string;
  label: string;
  detail: string | ((s: Sim) => string);
  minutes: number | ((s: Sim) => number);
  price?: number | ((s: Sim) => number);
  pay?: PayMode; // default "any"
  mode?: SimMode;
  /** Return a reason if you CAN'T do this right now, or null if you can. */
  available?: (s: Sim) => string | null;
  run?: (s: Sim, notes: string[], minutes: number) => string;
  opens?: "clothes" | "barber" | "atm";
  noDiscount?: boolean;
}

export interface PlaceDef {
  id: string;
  name: string;
  kind: string;
  desc: string;
  hours?: [number, number];
  owner?: string; // NPC id: be their friend (50+) for 10% off
  home?: HomeId;
  spot?: [number, number]; // for open-air places with no building
  actions: ActionDef[];
}

// ---------- Helpers ----------
const meal = (id: string, label: string, price: number, hunger: number, happy: number, lines: string[], minutes = 25): ActionDef => ({
  id, label, price, minutes,
  detail: `Hunger +${hunger}${happy ? ` · Happiness +${happy}` : ""}`,
  run: (s) => {
    add(s, "hunger", hunger);
    add(s, "happiness", happy);
    return pick(lines);
  },
});

const buy = (item: ItemId, qty = 1, price?: number): ActionDef => ({
  id: `buy_${item}`,
  label: `Buy ${ITEMS[item].name}${qty > 1 ? ` ×${qty}` : ""}`,
  detail: ITEMS[item].desc,
  minutes: 5,
  price: price ?? ITEMS[item].price * qty,
  available: (s) => (ITEMS[item].durable && hasItem(s, item) ? "You already have one." : null),
  run: (s) => {
    addItem(s, item, qty);
    return `Bought ${ITEMS[item].name}${qty > 1 ? ` ×${qty}` : ""}. It's in your bag (press I).`;
  },
});

const fuelCost = (s: Sim) => Math.round(s.fuelPrice * 1.25);
const codingLevel = (s: Sim) => Math.floor(s.skills.coding);
const hustleLevel = (s: Sim) => Math.floor(s.skills.hustle);

function sleepMinutes(s: Sim) {
  const h = hourNow(s);
  if (h >= 20) return Math.round((24 - h + 7) * 60);
  if (h < 5) return Math.round((7 - h) * 60);
  return 120;
}

// ---------- Home actions (shared by every kind of home) ----------
function homeActions(home: HomeId): ActionDef[] {
  const bucket = HOMES[home].bath === "bucket";
  const list: ActionDef[] = [
    {
      id: "sleep",
      label: "Sleep",
      detail: (s) => (sleepMinutes(s) > 120 ? "Sleep until 7 AM. Energy back to full." : "Take a 2-hour nap. Energy +25."),
      minutes: sleepMinutes,
      mode: "sleep",
      run: (s, _notes, mins) => {
        let quality = home === "uncle" ? 0.9 : home === "selfcon" ? 1.08 : 1;
        const light = powered(s);
        if (!light) quality *= 0.75;
        add(s, "energy", mins * 0.2 * quality);
        add(s, "health", mins > 300 ? 6 : 1);
        if (!light) {
          add(s, "happiness", -4);
          return "No light, no fan. The mosquitoes held a party on your body all night.";
        }
        add(s, "happiness", 3);
        return mins > 300 ? "You slept like a baby. Good morning, Lagos." : "Short nap. You feel a bit better.";
      },
    },
    {
      id: "bath",
      label: bucket ? "Bucket bath" : "Hot shower",
      detail: bucket ? "Hygiene +55" : "Hygiene +70 · Happiness +3",
      minutes: bucket ? 30 : 20,
      run: (s) => {
        add(s, "hygiene", bucket ? 55 : 70);
        if (!bucket) add(s, "happiness", 3);
        return bucket ? "Fetched water, cold bucket bath. Fresh like Agege bread." : "Hot shower. This is what self-con money buys.";
      },
    },
    {
      id: "cook",
      label: "Cook instant noodles",
      detail: "Uses 1 pack · Hunger +40",
      minutes: 20,
      available: (s) => (hasItem(s, "noodles") ? null : "You have no noodles. Yaba Mart sells them."),
      run: (s) => {
        addItem(s, "noodles", -1);
        add(s, "hunger", 40);
        add(s, "happiness", 2);
        return "Noodles, small pepper, no egg. Still sweet.";
      },
    },
    {
      id: "gen",
      label: "Start the generator",
      detail: "Uses 1 litre of fuel · Light for 8 hours",
      minutes: 5,
      available: (s) =>
        !hasItem(s, "generator") ? "You don't own a generator. Gadget Plaza sells them."
        : s.nepa ? "NEPA light is on. No need for gen."
        : s.genUntil > s.time ? "The generator is already running."
        : !hasItem(s, "fuel") ? "No fuel. Buy some at Yaba Market."
        : null,
      run: (s) => {
        addItem(s, "fuel", -1);
        s.genUntil = s.time + 480;
        return "The generator coughs to life. Your neighbours now dislike you a little.";
      },
    },
    {
      id: "laptop",
      label: "Freelance on your laptop (3h)",
      detail: (s) => `Earn ${naira(5000 + codingLevel(s) * 2500)} to your bank · needs power`,
      minutes: 180,
      mode: "work",
      available: (s) =>
        !hasItem(s, "laptop") ? "You need a laptop. Gadget Plaza sells them."
        : !powered(s) ? "No light. Wait for NEPA or start your generator."
        : s.skills.coding < 1 ? "You need some coding skill. Read at the Akoka University library."
        : null,
      run: (s) => {
        const pay = 5000 + codingLevel(s) * 2500;
        earn(s, pay, "bank", "Freelance client");
        addSkill(s, "coding", 0.12);
        return `Client approved your work. ${naira(pay)} landed in your account.`;
      },
    },
    {
      id: "movie",
      label: "Watch Nollywood on your phone (1h)",
      detail: "Happiness +6 · Energy +4",
      minutes: 60,
      mode: "rest",
      run: (s) => {
        add(s, "happiness", 6);
        add(s, "energy", 4);
        return pick([
          "The village people struck again. Classic.",
          "A billionaire disguised as a driver. You saw the ending coming. Still enjoyed it.",
          "Part 1 ended on a cliffhanger. Part 2 is not out.",
        ]);
      },
    },
  ];

  if (HOMES[home].rent > 0) {
    list.push({
      id: "rent",
      label: "Pay rent (1 week)",
      detail: (s) => rentStatus(s),
      minutes: 5,
      price: () => HOMES[home].rent,
      pay: "bank",
      noDiscount: true,
      available: (s) => (s.rentPaidUntil - today(s) > 7 ? "You've already paid ahead." : null),
      run: (s) => {
        s.rentPaidUntil += 7;
        msg(s, "landlord", HOMES[home].landlord, `Received. Rent paid until Day ${s.rentPaidUntil + 1}. God bless you.`);
        return `Rent paid. You're covered until Day ${s.rentPaidUntil + 1}.`;
      },
    });
  }

  if (home === "uncle") {
    list.push(
      {
        id: "errand",
        label: "Run an errand for Uncle Dayo (1h)",
        detail: "₦1,000 tip · keeps Uncle happy",
        minutes: 60,
        available: (s) => (flag(s, "lastErrandDay") === today(s) ? "You already ran today's errand." : null),
        run: (s) => {
          setFlag(s, "lastErrandDay", today(s));
          earn(s, 1000, "cash", "Tip from Uncle Dayo");
          add(s, "happiness", 2);
          return pick([
            "You bought Uncle's newspaper and recharge card. He said 'Good boy/girl' and gave you ₦1,000.",
            "You carried Aunty's shopping from the market. ₦1,000 tip.",
          ]);
        },
      },
      {
        id: "stew",
        label: "Eat Aunty's stew",
        detail: "Free, once a day · Hunger +40",
        minutes: 25,
        available: (s) => (flag(s, "uncleMealDay") === today(s) ? "Aunty: 'Did you not eat already?'" : null),
        run: (s) => {
          setFlag(s, "uncleMealDay", today(s));
          add(s, "hunger", 40);
          add(s, "happiness", 4);
          return "Rice and Aunty's stew. Nothing beats home food.";
        },
      },
    );
  }
  return list;
}

// ---------- All the places in Yaba ----------
export const PLACES: Record<string, PlaceDef> = {
  buka: {
    id: "buka", name: "Mama Nkechi's Buka", kind: "Local food", hours: [7, 21], owner: "mama_nkechi",
    desc: "Hot swallow, rice and stew. Mama Nkechi remembers faces, and gives friends a discount.",
    actions: [
      meal("amala", "Amala, ewedu & gbegiri", 1800, 55, 4, ["Swallow done. You're now operating at full capacity.", "Mama added extra meat. She likes you."]),
      meal("jollof", "Jollof rice, plantain & chicken", 2800, 60, 7, ["Party jollof on a Tuesday. You deserve it."]),
      meal("eba", "Eba & egusi", 1500, 50, 2, ["Heavy and satisfying. Sleep is calling."]),
      {
        id: "wash", label: "Wash plates for Mama (2h)", detail: "Earn ₦3,000 cash + free food", minutes: 120, mode: "work",
        available: (s) => (flag(s, "washDay") === today(s) ? "Mama: 'You don wash today. Come back tomorrow.'" : null),
        run: (s) => {
          setFlag(s, "washDay", today(s));
          earn(s, 3000, "cash", "Mama Nkechi (plates)");
          add(s, "hunger", 25);
          add(s, "hygiene", -10);
          rel(s, "mama_nkechi", 3);
          return "Plates sparkling. Mama paid ₦3,000 and gave you rice.";
        },
      },
    ],
  },

  hub: {
    id: "hub", name: "Sabo Tech Hub", kind: "Co-working", hours: [8, 22],
    desc: "Steady power, fast wifi, and freelancers chasing dollar clients. Day pass ₦2,000.",
    actions: [
      {
        id: "freelance", label: "Freelance session (3h)",
        detail: (s) => `Earn ${naira(6000 + codingLevel(s) * 2500)} to your bank${flag(s, "passDay") === today(s) ? "" : " · includes ₦2,000 day pass"}`,
        minutes: 180, mode: "work",
        price: (s) => (flag(s, "passDay") === today(s) ? 0 : 2000),
        available: (s) => (s.skills.coding < 1 ? "You need coding skill 1+. Read at the Akoka University library or watch tutorials here." : null),
        run: (s) => {
          setFlag(s, "passDay", today(s));
          const pay = 6000 + codingLevel(s) * 2500;
          earn(s, pay, "bank", "Freelance client");
          addSkill(s, "coding", 0.15);
          return pick([
            `Fixed a client's website bug. ${naira(pay)} paid.`,
            `Built a landing page for a small business. ${naira(pay)} paid.`,
          ]);
        },
      },
      {
        id: "tutorials", label: "Watch coding tutorials (2h)", detail: "Coding +0.4 · Social +4", minutes: 120, price: 500,
        run: (s) => {
          addSkill(s, "coding", 0.4);
          add(s, "social", 4);
          return "You finally understood what an API is.";
        },
      },
      {
        id: "network", label: "Network with techies (1h)", detail: "Social +15 · Happiness +3", minutes: 60,
        run: (s) => {
          add(s, "social", 15);
          add(s, "happiness", 3);
          rel(s, "chiamaka", 2);
          return pick(["Someone pitched you their 'Uber for okada' startup.", "You swapped numbers with a designer from Ibadan."]);
        },
      },
    ],
  },

  mart: {
    id: "mart", name: "Yaba Mart", kind: "Supermarket", hours: [8, 21],
    desc: "Groceries and snacks. Things you buy go into your bag (press I to use them).",
    actions: [
      buy("bread"),
      buy("noodles", 3),
      buy("meatroll"),
      buy("chips"),
      buy("water", 10, 400),
      {
        id: "shift", label: "Work your shift (8h)", detail: "₦9,000 to your bank · Clock in 8–10 AM, Mon–Sat",
        minutes: 480, mode: "work",
        available: (s) => {
          if (s.background !== "worker") return "Staff only. You don't work here.";
          if (flag(s, "fired", 0)) return "Security won't let you in. You were fired.";
          if (weekdayNow(s) === 6) return "No shifts on Sunday.";
          if (flag(s, "lastShiftDay") === today(s)) return "You already worked today.";
          const h = hourNow(s);
          if (h < 8 || h >= 10) return "Clock-in is between 8 and 10 AM.";
          return null;
        },
        run: (s) => {
          setFlag(s, "lastShiftDay", today(s));
          earn(s, 9000, "bank", "Yaba Mart salary (shift)");
          addSkill(s, "hustle", 0.1);
          return pick(["Shift done. A customer argued about ₦50 change for 20 minutes.", "Shift done. You restocked 400 tins of tomato paste."]);
        },
      },
    ],
  },

  crunchy: {
    id: "crunchy", name: "Crunchy Republic", kind: "Fast food", hours: [9, 22],
    desc: "Chicken, rice and the strongest AC in Yaba.",
    actions: [
      {
        ...meal("combo", "Crunchy combo (chicken & rice)", 4500, 60, 12, ["The chicken was crunchy, as promised."]),
        run: (s) => { setFlag(s, "crunchyDay", today(s)); add(s, "hunger", 60); add(s, "happiness", 12); return "The chicken was crunchy, as advertised."; },
      },
      {
        ...meal("icecream", "Ice cream", 1500, 5, 8, [""], 15),
        run: (s) => { setFlag(s, "crunchyDay", today(s)); add(s, "hunger", 5); add(s, "happiness", 8); return "Cold ice cream in Lagos heat. Pure joy."; },
      },
      {
        id: "ac", label: "Sit in the AC (1h)", detail: "Energy +6 · Happiness +4 · customers only", minutes: 60, mode: "rest",
        available: (s) => (flag(s, "crunchyDay") === today(s) ? null : "Security: 'Buy something first, boss.'"),
        run: (s) => { add(s, "energy", 6); add(s, "happiness", 4); return "You sat in the AC until your soul came back."; },
      },
    ],
  },

  bank: {
    id: "bank", name: "Naija Trust Bank", kind: "Bank & ATM",
    desc: "ATM lobby, open 24 hours. Withdraw cash for danfo, keke and street food. Deposit to keep it safe.",
    actions: [{ id: "atm", label: "Use the ATM", detail: "Withdraw or deposit cash", minutes: 0, opens: "atm" }],
  },

  church: {
    id: "church", name: "Grace Assembly", kind: "Church", hours: [6, 21],
    desc: "Midweek fellowship on Wednesday evenings. Sunday service in the morning.",
    actions: [
      {
        id: "sunday", label: "Sunday service (3h)", detail: "Sundays 7 AM – 12 PM · Happiness +15 · Social +20", minutes: 180,
        available: (s) => (weekdayNow(s) !== 6 ? "Service is on Sunday morning." : hourNow(s) < 7 || hourNow(s) >= 12 ? "Sunday service runs 7 AM – 12 PM." : null),
        run: (s) => { add(s, "happiness", 15); add(s, "social", 20); rel(s, "pastor_femi", 5); return "The choir was on fire. Pastor's sermon was 'just 10 more minutes' for an hour."; },
      },
      {
        id: "fellowship", label: "Midweek fellowship (1.5h)", detail: "Wednesdays 5–8 PM · Happiness +12 · Social +15", minutes: 90,
        available: (s) => (weekdayNow(s) !== 2 ? "Fellowship is on Wednesday evening." : hourNow(s) < 17 || hourNow(s) >= 20 ? "Fellowship runs 5–8 PM." : null),
        run: (s) => { add(s, "happiness", 12); add(s, "social", 15); rel(s, "pastor_femi", 3); return "Small group, good people, plenty of chin-chin."; },
      },
      {
        id: "pray", label: "Pray quietly (30m)", detail: "Happiness +5", minutes: 30, mode: "rest",
        run: (s) => { add(s, "happiness", 5); return "Quiet time. Lagos noise faded for a while."; },
      },
      {
        id: "offering", label: "Give offering", detail: "Happiness +3", minutes: 5, price: 1000,
        run: (s) => { add(s, "happiness", 3); rel(s, "pastor_femi", 2); return "Seed sown."; },
      },
    ],
  },

  gadget: {
    id: "gadget", name: "Gadget Plaza", kind: "Electronics", hours: [9, 19], owner: "emeka",
    desc: "Laptops, generators and phone repairs. Emeka gives friends a better price.",
    actions: [
      buy("laptop"),
      buy("generator"),
      {
        id: "window", label: "Window-shop (15m)", detail: "Happiness +2", minutes: 15,
        run: (s) => { add(s, "happiness", 2); return "You looked at the newest phone for a long time. One day."; },
      },
    ],
  },

  clinic: {
    id: "clinic", name: "St. Mercy Clinic", kind: "Clinic",
    desc: "Open 24 hours. Nurses here have seen everything.",
    actions: [
      {
        id: "checkup", label: "Check-up (1h)", detail: "Health +15", minutes: 60, price: 2000,
        run: (s) => { add(s, "health", 15); return "Doctor said: 'Drink water and rest.' Classic."; },
      },
      {
        id: "treatment", label: "Full treatment (3h)", detail: "Health back to 100 · Energy +10", minutes: 180, price: 8000,
        run: (s) => { s.needs.health = 100; add(s, "energy", 10); return "Drip, injection, and a stern warning to eat properly."; },
      },
    ],
  },

  uni: {
    id: "uni", name: "Akoka University", kind: "University", hours: [7, 20],
    desc: "Lecture halls, a library with real AC, and a cafeteria with suspicious meat pie.",
    actions: [
      {
        id: "lecture", label: "Attend lecture (2h)", detail: "Students only · Mon–Fri, start 8:30 AM – 12 PM · Coding +0.3", minutes: 120,
        available: (s) => {
          if (s.background !== "student") return "You're not a student here.";
          if (weekdayNow(s) > 4) return "No lectures at the weekend.";
          if (flag(s, "lastLectureDay") === today(s)) return "You already attended today.";
          const h = hourNow(s);
          if (h < 8.5 || h >= 12) return "Lectures start between 8:30 AM and 12 PM.";
          return null;
        },
        run: (s) => {
          setFlag(s, "lastLectureDay", today(s));
          addSkill(s, "coding", 0.3);
          add(s, "social", 8);
          rel(s, "tunde", 2);
          return pick(["Lecturer arrived 40 minutes late, then gave an assignment.", "Data structures today. Tunde slept through it."]);
        },
      },
      {
        id: "library", label: "Read in the library (2h)", detail: "Free · Coding +0.5", minutes: 120,
        run: (s) => { addSkill(s, "coding", 0.5); add(s, "happiness", -1); return "Two hours with a programming book. Your brain is warm."; },
      },
      meal("cafeteria", "Cafeteria rice & meat pie", 900, 35, 1, ["Cafeteria food. It did the job."]),
    ],
  },

  alhaji: {
    id: "alhaji", name: "Alhaji Properties", kind: "Estate agent", hours: [9, 17], owner: "alhaji_lateef",
    desc: "Rent a new place or pay your current rent. Rent is weekly in this game; agency fee is paid once.",
    actions: [
      moveTo("hostel", 0),
      moveTo("room", 10000),
      moveTo("selfcon", 20000),
      {
        id: "payrent", label: "Pay rent for your current home", detail: (s) => rentStatus(s), minutes: 10,
        price: (s) => HOMES[s.home].rent, pay: "bank", noDiscount: true,
        available: (s) => (HOMES[s.home].rent === 0 ? "You don't pay rent at Uncle Dayo's." : s.rentPaidUntil - today(s) > 7 ? "You've already paid ahead." : null),
        run: (s) => { s.rentPaidUntil += 7; return `Alhaji stamped your receipt. Paid until Day ${s.rentPaidUntil + 1}.`; },
      },
    ],
  },

  goalzone: {
    id: "goalzone", name: "Goal Zone Viewing Centre", kind: "Viewing centre", hours: [12, 24],
    desc: "Big screen, loud fans, generator always on. Weekend matches are wild.",
    actions: [
      {
        id: "match", label: "Watch a match (2h)", detail: (s) => (weekdayNow(s) >= 5 ? "Weekend derby! Happiness +18 · Social +15" : "Happiness +12 · Social +12"),
        minutes: 120, price: 500,
        run: (s) => {
          const big = weekdayNow(s) >= 5;
          add(s, "happiness", big ? 18 : 12);
          add(s, "social", big ? 15 : 12);
          const h = hourNow(s);
          if (h >= 17 && h < 22) rel(s, "tunde", 3);
          return big ? "Last-minute winner! The whole centre ran outside screaming." : "Draw. Everybody is a coach now.";
        },
      },
      {
        id: "ps", label: "Play PlayStation (1h)", detail: "Happiness +8", minutes: 60, price: 300,
        run: (s) => { add(s, "happiness", 8); return pick(["You won 3–1. The boy you beat wants a rematch.", "Lost to a 12-year-old. Again."]); },
      },
    ],
  },

  market: {
    id: "market", name: "Yaba Market", kind: "Market", hours: [7, 19], owner: "iya_basira",
    desc: "Clothes, foodstuff, black-market fuel and every kind of hustle. Always price am.",
    actions: [
      { id: "clothes", label: "Buy clothes (bargain allowed)", detail: "Change your look", minutes: 0, opens: "clothes" },
      {
        id: "fuel", label: "Buy fuel (1 litre, black market)", detail: (s) => `For your generator · ${naira(fuelCost(s))} today`,
        minutes: 10, price: fuelCost, pay: "cash", noDiscount: true,
        run: (s) => { addItem(s, "fuel", 1); return "One litre in a recycled vegetable-oil bottle. Na so."; },
      },
      meal("corn", "Roasted corn & ube", 600, 15, 4, ["Corn and pear. Lagos street classic."], 15),
      {
        id: "loads", label: "Carry loads for traders (2h)", detail: (s) => `Earn ${naira(3500 + hustleLevel(s) * 300)} cash · tiring`,
        minutes: 120, mode: "work",
        run: (s) => {
          const pay = 3500 + hustleLevel(s) * 300;
          earn(s, pay, "cash", "Market loads");
          addSkill(s, "hustle", 0.2);
          add(s, "hygiene", -15);
          return `Your back is crying but you made ${naira(pay)}.`;
        },
      },
      {
        id: "stall", label: "Run your phone-accessories stall (4h)", detail: "Cash sales · Saturdays pay best", minutes: 240, mode: "work",
        available: (s) => (s.background !== "entrepreneur" ? "You don't own a stall here." : flag(s, "stallDay") === today(s) ? "You already opened today." : null),
        run: (s) => {
          setFlag(s, "stallDay", today(s));
          const sat = weekdayNow(s) === 5 ? 1.5 : 1;
          const pay = Math.round((rand(5000, 14000) * (1 + s.skills.hustle * 0.12) * sat) / 50) * 50;
          earn(s, pay, "cash", "Stall sales");
          addSkill(s, "hustle", 0.25);
          rel(s, "iya_basira", 2);
          return `Sold chargers, screen guards and two power banks. ${naira(pay)} in sales.`;
        },
      },
    ],
  },

  barber: {
    id: "barber", name: "Fresh Cutz", kind: "Barber & salon", hours: [8, 21], owner: "bisi",
    desc: "New hairstyles and quick shape-ups. Bisi talks while she works.",
    actions: [
      { id: "style", label: "Get a new hairstyle", detail: "₦2,500 · choose your style", minutes: 0, opens: "barber" },
      {
        id: "shape", label: "Quick shape-up (30m)", detail: "Hygiene +10 · Happiness +5", minutes: 30, price: 1500,
        run: (s) => { add(s, "hygiene", 10); add(s, "happiness", 5); rel(s, "bisi", 2); return "Sharp. You keep checking yourself in every car window."; },
      },
    ],
  },

  suya: {
    id: "suya", name: "Mallam Musa's Suya", kind: "Street food", hours: [18, 26], spot: [21.1, -41], owner: "mallam_musa",
    desc: "The best suya in Yaba. Only opens at night.",
    actions: [
      meal("suya", "Beef suya with onions", 1500, 25, 10, ["Yaji everywhere. Worth it."], 15),
      meal("suyadrink", "Suya & a cold drink", 2200, 30, 13, ["Suya and a cold drink under the streetlight. Perfect."], 20),
      {
        id: "gistmusa", label: "Gist with Mallam (15m)", detail: "Social +8", minutes: 15,
        run: (s) => { add(s, "social", 8); rel(s, "mallam_musa", 3); return "Mallam told you about his days in Kano. He laughs with his whole body."; },
      },
    ],
  },

  pitch: {
    id: "pitch", name: "Akoka Football Field", kind: "Football pitch", hours: [6, 19], spot: [-69.4, 66],
    desc: "Dusty pitch, sandals for goalposts on bad days. Seyi plays here in the evenings.",
    actions: [
      {
        id: "football", label: "Play football (1h)", detail: "Happiness +12 · Social +10 · Fitness +0.3 · tiring", minutes: 60, mode: "work",
        run: (s) => {
          add(s, "happiness", 12);
          add(s, "social", 10);
          add(s, "hygiene", -25);
          addSkill(s, "fitness", 0.3);
          const h = hourNow(s);
          if (h >= 15 && h < 19) {
            rel(s, "seyi", 3);
            return "Seyi nutmegged you twice, then passed for your goal. Respect.";
          }
          return "Five-a-side with strangers. You scored one. Nobody saw it.";
        },
      },
      {
        id: "jog", label: "Jog laps (30m)", detail: "Fitness +0.2 · Health +3", minutes: 30, mode: "work",
        run: (s) => { addSkill(s, "fitness", 0.2); add(s, "health", 3); add(s, "happiness", 4); return "Four laps. Your lungs filed a complaint."; },
      },
    ],
  },

  home_uncle: { id: "home_uncle", name: "Uncle Dayo's flat", kind: "Home", home: "uncle", desc: "The couch is yours. The remote is not.", actions: homeActions("uncle") },
  home_hostel: { id: "home_hostel", name: "Akoka Hostel, Room B12", kind: "Home", home: "hostel", desc: "Bunk bed, shared bathroom, and a roommate who snores.", actions: homeActions("hostel") },
  home_room: { id: "home_room", name: "No. 14 Alagomeji", kind: "Home", home: "room", desc: "Face-me-I-face-you room. Thin walls, loud neighbours, your own space.", actions: homeActions("room") },
  home_selfcon: { id: "home_selfcon", name: "Sabo Court self-con", kind: "Home", home: "selfcon", desc: "Your own kitchen and bathroom. Soft life.", actions: homeActions("selfcon") },
};

function moveTo(home: HomeId, fee: number): ActionDef {
  const h = HOMES[home];
  return {
    id: `move_${home}`,
    label: `Rent ${h.name}`,
    detail: `${naira(h.rent)}/week${fee ? ` + ${naira(fee)} agency fee` : ""} · move in today`,
    minutes: 60,
    price: h.rent + fee,
    pay: "bank",
    available: (s) =>
      s.home === home ? "You already live here."
      : home === "hostel" && s.background !== "student" ? "Hostel rooms are for students only."
      : null,
    run: (s) => {
      s.home = home;
      s.rentPaidUntil = today(s) + 7;
      return `Keys collected! You now live at ${h.name}. It's marked on your map.`;
    },
  };
}

/** The value of something that may be a number or a function of the Sim. */
export function val<T>(v: T | ((s: Sim) => T), s: Sim): T {
  return typeof v === "function" ? (v as (s: Sim) => T)(s) : v;
}

export const backgroundName = (s: Sim) => BACKGROUNDS[s.background].name;
