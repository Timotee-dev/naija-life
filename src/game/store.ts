// THE GAME STORE (zustand). One place that holds the saved game (`sim`) and the UI state,
// plus every action the player can take. React components read from it; buttons call its functions.

import { create } from "zustand";
import { HOMES } from "./data/backgrounds";
import { CLOTHES } from "./data/clothes";
import { ITEMS } from "./data/items";
import { BUILDINGS, STOPS } from "./data/map";
import { NPC_BY_ID, tierOf } from "./data/npcs";
import { PLACES, val } from "./data/places";
import { runtime } from "./runtime";
import { findPrompt, placePoint, type Prompt } from "./systems/interact";
import { deleteSave, readSave, writeSave, type Slot } from "./systems/save";
import {
  add, addItem, createSim, flag, itemCount, msg, passTime, payRent, rel, relOf, setFlag, spend, today,
} from "./systems/sim";
import type { Appearance, BackgroundId, HairStyle, ItemId, Sim, ThreadId } from "./types";
import { dist, hourOf, isOpen, naira, pick } from "./utils";

export type Screen = "menu" | "create" | "game";
export type Modal =
  | { kind: "place"; id: string; sub?: "clothes" | "barber" | "atm" }
  | { kind: "npc"; id: string }
  | { kind: "stop"; id: string }
  | { kind: "phone" }
  | { kind: "inventory" }
  | { kind: "pause" }
  | null;
export type PhoneApp = "home" | "messages" | "bank" | "ride" | "map" | "profile" | "diary" | "settings";
export type TravelMode = "danfo" | "keke" | "ride";

export interface Toast {
  id: number;
  text: string;
}

export interface Settings {
  shadows: boolean;
  quality: "low" | "high";
  timeSpeed: number;
  touch: "auto" | "on" | "off";
}

const SETTINGS_KEY = "naijalife.settings";
const DEFAULT_SETTINGS: Settings = { shadows: true, quality: "high", timeSpeed: 1, touch: "auto" };
function loadSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface GameState {
  screen: Screen;
  sim: Sim | null;
  modal: Modal;
  phoneApp: PhoneApp;
  thread: ThreadId | null;
  prompt: Prompt | null;
  toasts: Toast[];
  placeLog: string[];
  dialogLine: string;
  fadeKey: number;
  settings: Settings;
  bargains: Record<string, { price: number; tried: boolean }>;

  goto: (screen: Screen) => void;
  startNewGame: (name: string, appearance: Appearance, background: BackgroundId) => void;
  loadGame: (slot: Slot) => boolean;
  saveGame: (slot: Slot) => boolean;
  removeSave: (slot: Slot) => void;
  quitToMenu: () => void;
  tick: (minutes: number) => void;
  updatePrompt: () => void;
  interact: () => void;
  openModal: (m: Modal) => void;
  closeModal: () => void;
  openPhone: (app?: PhoneApp) => void;
  setPhoneApp: (app: PhoneApp) => void;
  openThread: (t: ThreadId | null) => void;
  doAction: (placeId: string, actionId: string) => void;
  useItem: (id: ItemId) => void;
  talk: (npcId: string, option: "greet" | "gist" | "advice" | "credit") => void;
  travel: (mode: TravelMode, dest: string) => void;
  answerMessage: (id: number, choice: number) => void;
  bargain: (itemId: string) => void;
  buyClothes: (itemId: string) => void;
  haircut: (style: HairStyle) => void;
  atm: (op: "withdraw" | "deposit", amount: number) => void;
  payRentNow: () => void;
  setWaypoint: (w: Sim["waypoint"]) => void;
  toast: (text: string) => void;
  updateSettings: (p: Partial<Settings>) => void;
}

let toastId = 1;

// ---------- Travel helpers (used by the store and the UI) ----------
export function travelQuote(mode: TravelMode, dest: string, s: Sim) {
  const from = runtime.player;
  const to = mode === "danfo" ? STOPS.find((x) => x.id === dest)! : placePoint(dest);
  const d = dist(from.x, from.z, to.x, to.z);
  const h = hourOf(s.time);
  const night = h >= 21 || h < 6;
  if (mode === "danfo") return { price: 300, minutes: Math.round(8 + d / 6), pay: "cash" as const, to };
  if (mode === "keke") return { price: Math.round((500 + d * 4) / 50) * 50, minutes: Math.round(5 + d / 9), pay: "cash" as const, to };
  return { price: Math.round(((900 + d * 18) * (night ? 1.3 : 1)) / 50) * 50, minutes: Math.round(4 + d / 13), pay: "bank" as const, to };
}

/** The price you'd actually pay for an action (friends of the owner get 10% off). */
export function effectivePrice(placeId: string, actionId: string, s: Sim) {
  const place = PLACES[placeId];
  const action = place?.actions.find((a) => a.id === actionId);
  if (!action?.price) return 0;
  let price = val(action.price, s);
  if (price > 0 && !action.noDiscount && place.owner && relOf(s, place.owner) >= 50) price = Math.round((price * 0.9) / 50) * 50;
  return price;
}

/** Places you can travel to by keke or ride app: every public place plus your own home. */
export function travelDestinations(s: Sim) {
  return Object.values(PLACES).filter((p) => !p.home || p.home === s.home);
}

export const useGame = create<GameState>()((set, get) => {
  const toast = (text: string) => {
    const t = { id: toastId++, text };
    set({ toasts: [...get().toasts.slice(-3), t] });
    window.setTimeout(() => set({ toasts: get().toasts.filter((x) => x.id !== t.id) }), 4200);
  };

  const teleport = (p: { x: number; z: number }) => {
    set({ fadeKey: get().fadeKey + 1 });
    runtime.blockInputUntil = performance.now() + 700;
    window.setTimeout(() => {
      runtime.teleport = p;
      runtime.snapCamera = true;
    }, 320);
  };

  /** If you collapse from exhaustion or bad health, something happens to you. */
  const checkCollapse = (s: Sim, notes: string[]): { x: number; z: number } | null => {
    if (s.needs.health <= 0) {
      passTime(s, 360, "rest", notes);
      s.needs.health = 55;
      s.needs.energy = Math.max(s.needs.energy, 40);
      s.needs.hunger = Math.max(s.needs.hunger, 40);
      const paid = spend(s, 5000, "bank", "St. Mercy Clinic (emergency)");
      notes.push(paid
        ? "You collapsed and woke up at St. Mercy Clinic. The bill was ₦5,000."
        : "You collapsed and woke up at St. Mercy Clinic. The nurses waived the bill. Take care of yourself.");
      return placePoint("clinic");
    }
    if (s.needs.energy <= 0) {
      passTime(s, 180, "sleep", notes);
      s.needs.energy = 35;
      const lost = Math.min(1000, s.cash);
      if (lost > 0) spend(s, lost, "cash", "Lost while asleep");
      notes.push(`Too tired to stand, you dozed off on a bench for 3 hours.${lost ? ` Someone "borrowed" ${naira(lost)} from your pocket.` : ""}`);
    }
    return null;
  };

  const needWarnings = (s: Sim, notes: string[]) => {
    const warn = (k: string, low: boolean, recovered: boolean, text: string) => {
      if (low && !flag(s, `warn_${k}`, 0)) {
        setFlag(s, `warn_${k}`, 1);
        notes.push(text);
      } else if (recovered) setFlag(s, `warn_${k}`, 0);
    };
    const n = s.needs;
    warn("hunger", n.hunger < 20, n.hunger > 40, "You're hungry. Try the buka, Yaba Mart, or suya at night.");
    warn("energy", n.energy < 15, n.energy > 35, "You're exhausted. Go home and sleep before you collapse.");
    warn("hygiene", n.hygiene < 20, n.hygiene > 40, "People are stepping away from you. Time for a bath.");
    warn("health", n.health < 30, n.health > 50, "Your health is low. Eat, rest, or visit St. Mercy Clinic.");
    warn("social", n.social < 15, n.social > 35, "You feel lonely. Talk to people, or go to church or Goal Zone.");
  };

  /** Copies the Sim, lets `fn` change the copy, then saves it back and shows any notices. */
  const mutate = <T,>(fn: (s: Sim, notes: string[]) => T): T | undefined => {
    const cur = get().sim;
    if (!cur) return undefined;
    const s = structuredClone(cur);
    const notes: string[] = [];
    const out = fn(s, notes);
    const tp = checkCollapse(s, notes);
    if (s.home !== cur.home) {
      const p = placePoint(HOMES[s.home].place);
      s.waypoint = { x: p.x, z: p.z, label: HOMES[s.home].short };
    }
    set({ sim: s });
    runtime.liveTime = s.time;
    notes.forEach(toast);
    if (tp) {
      set({ modal: null });
      teleport(tp);
    }
    return out;
  };

  const placeAt = (s: Sim) => {
    runtime.player.x = s.pos[0];
    runtime.player.z = s.pos[1];
    runtime.player.y = 0;
    runtime.player.yaw = s.yaw;
    runtime.teleport = { x: s.pos[0], z: s.pos[1] };
    runtime.snapCamera = true;
    runtime.cameraYawRequest = s.yaw + Math.PI; // camera sits behind you
    runtime.liveTime = s.time;
    runtime.lastAutosave = performance.now();
  };

  return {
    screen: "menu",
    sim: null,
    modal: null,
    phoneApp: "home",
    thread: null,
    prompt: null,
    toasts: [],
    placeLog: [],
    dialogLine: "",
    fadeKey: 0,
    settings: loadSettings(),
    bargains: {},

    goto: (screen) => set({ screen }),

    startNewGame: (name, appearance, background) => {
      const s = createSim(name, appearance, background);
      const home = placePoint(HOMES[s.home].place);
      const door = BUILDINGS.find((b) => b.place === HOMES[s.home].place);
      s.pos = [home.x, home.z];
      // Face out of your front door, toward the street.
      s.yaw = door ? ({ "+x": Math.PI / 2, "-x": -Math.PI / 2, "+z": 0, "-z": Math.PI }[door.facing]) : 0;
      placeAt(s);
      runtime.cameraYawRequest = s.yaw; // camera out on the street, looking at you and your front door
      set({ sim: s, screen: "game", modal: null, prompt: null, placeLog: [] });
      writeSave("auto", s);
      toast(`Day 1, Monday, 7:00 AM. Welcome to Yaba, ${name}.`);
      toast("Move with WASD or the joystick. Press E near doors and people.");
    },

    loadGame: (slot) => {
      const s = readSave(slot);
      if (!s) return false;
      placeAt(s);
      set({ sim: s, screen: "game", modal: null, prompt: null, placeLog: [] });
      toast(`Loaded ${s.name}'s life.`);
      return true;
    },

    saveGame: (slot) => {
      const s = get().sim;
      if (!s) return false;
      const copy = { ...s, pos: [runtime.player.x, runtime.player.z] as [number, number], yaw: runtime.player.yaw };
      const ok = writeSave(slot, copy);
      toast(ok ? (slot === "auto" ? "Autosaved." : `Saved to slot ${slot}.`) : "Couldn't save. Your browser is blocking storage.");
      return ok;
    },

    removeSave: (slot) => deleteSave(slot),

    quitToMenu: () => {
      const s = get().sim;
      if (s) writeSave("auto", { ...s, pos: [runtime.player.x, runtime.player.z], yaw: runtime.player.yaw });
      set({ screen: "menu", sim: null, modal: null, prompt: null });
    },

    tick: (minutes) => {
      const st = get();
      if (st.screen !== "game" || st.modal || minutes <= 0) return;
      const runMinutes = runtime.runSeconds * st.settings.timeSpeed;
      runtime.runSeconds = 0;
      mutate((s, notes) => {
        passTime(s, minutes, "normal", notes);
        add(s, "energy", -runMinutes * 0.06);
        s.pos = [runtime.player.x, runtime.player.z];
        s.yaw = runtime.player.yaw;
        needWarnings(s, notes);
        if (s.waypoint && dist(s.waypoint.x, s.waypoint.z, runtime.player.x, runtime.player.z) < 4) {
          notes.push(`You've arrived: ${s.waypoint.label}.`);
          s.waypoint = null;
        }
      });
      if (performance.now() - runtime.lastAutosave > 60000) {
        runtime.lastAutosave = performance.now();
        const s = get().sim;
        if (s) writeSave("auto", s);
      }
    },

    updatePrompt: () => {
      const s = get().sim;
      if (!s) return;
      const p = findPrompt(s, runtime.player.x, runtime.player.z);
      if ((p?.key ?? "") !== (get().prompt?.key ?? "")) set({ prompt: p });
    },

    interact: () => {
      const { prompt: p, modal, sim } = get();
      if (!p || modal || !sim) return;
      if (!p.enabled) {
        toast(p.sub ?? "You can't go in there.");
        return;
      }
      if (p.kind === "place") set({ modal: { kind: "place", id: p.id }, placeLog: [], bargains: {} });
      else if (p.kind === "stop") set({ modal: { kind: "stop", id: p.id } });
      else if (p.kind === "npc") {
        const npc = NPC_BY_ID[p.id];
        const line = pick(npc.greet[tierOf(relOf(sim, p.id))]).replace("{name}", sim.name);
        runtime.talkingTo = p.id;
        set({ modal: { kind: "npc", id: p.id }, dialogLine: line });
      } else {
        const ped = runtime.peds.get(Number(p.id));
        if (!ped) return;
        mutate((s) => add(s, "social", 3));
        toast(`${ped.name}: "${ped.line}"`);
      }
    },

    openModal: (m) => set({ modal: m }),
    closeModal: () => {
      runtime.talkingTo = null;
      set({ modal: null, bargains: {} });
    },
    openPhone: (app = "home") => set({ modal: { kind: "phone" }, phoneApp: app, thread: null }),
    setPhoneApp: (app) => set({ phoneApp: app, thread: null }),
    openThread: (t) => {
      set({ thread: t });
      if (t) {
        const s = get().sim;
        if (s && s.messages.some((m) => m.thread === t && !m.read)) {
          const copy = structuredClone(s);
          copy.messages.forEach((m) => {
            if (m.thread === t) m.read = true;
          });
          set({ sim: copy });
        }
      }
    },

    doAction: (placeId, actionId) => {
      const s0 = get().sim;
      const place = PLACES[placeId];
      const action = place?.actions.find((a) => a.id === actionId);
      if (!s0 || !place || !action) return;
      const log = (line: string) => set({ placeLog: [line, ...get().placeLog].slice(0, 5) });

      if (!isOpen(place.hours, s0.time)) return log(`${place.name} is closed now.`);
      if (action.opens) {
        set({ modal: { kind: "place", id: placeId, sub: action.opens } });
        return;
      }
      const why = action.available?.(s0);
      if (why) return log(why);

      const price = effectivePrice(placeId, actionId, s0);
      const pay = action.pay ?? "any";
      const minutes = val(action.minutes, s0);

      const result = mutate((s, notes) => {
        if (price > 0 && !spend(s, price, pay, `${place.name}: ${action.label}`)) {
          return `Not enough money. You need ${naira(price)}${pay === "cash" ? " in cash" : pay === "bank" ? " in your bank" : ""}.`;
        }
        if (minutes > 0) passTime(s, minutes, action.mode ?? "normal", notes);
        const line = action.run ? action.run(s, notes, minutes) : "";
        const cost = price > 0 ? `−${naira(price)}` : "";
        const time = minutes >= 60 ? `${Math.round((minutes / 60) * 10) / 10}h` : minutes > 0 ? `${minutes} min` : "";
        const meta = [cost, time].filter(Boolean).join(" · ");
        return meta ? `${line} (${meta})` : line;
      });
      if (result) log(result);
    },

    useItem: (id) => {
      const s = get().sim;
      const item = ITEMS[id];
      if (!s || !item.use || itemCount(s, id) <= 0) return;
      const hp = placePoint(HOMES[s.home].place);
      const atHome = dist(runtime.player.x, runtime.player.z, hp.x, hp.z) < 4;
      if (item.homeOnly && !atHome) {
        toast(`You need your stove. ${item.useLabel} it at home.`);
        return;
      }
      mutate((s, notes) => {
        addItem(s, id, -1);
        for (const [k, v] of Object.entries(item.use!)) add(s, k as keyof Sim["needs"], v);
        passTime(s, 5, "normal", notes);
        notes.push(`${item.useLabel ?? "Used"}: ${item.name}.`);
      });
    },

    talk: (npcId, option) => {
      const npc = NPC_BY_ID[npcId];
      const line = mutate((s, notes) => {
        const d = today(s);
        if (option === "greet") {
          passTime(s, 5, "normal", notes);
          add(s, "social", 4);
          if (flag(s, `greet_${npcId}`) !== d) {
            rel(s, npcId, 2);
            setFlag(s, `greet_${npcId}`, d);
          }
          return pick(npc.greet[tierOf(relOf(s, npcId))]).replace("{name}", s.name);
        }
        if (option === "gist") {
          passTime(s, 20, "normal", notes);
          add(s, "social", 12);
          add(s, "happiness", 3);
          if (flag(s, `gist_${npcId}`) !== d) {
            rel(s, npcId, 5);
            setFlag(s, `gist_${npcId}`, d);
          }
          return pick(npc.gist);
        }
        if (option === "advice") {
          passTime(s, 5, "normal", notes);
          return npc.advice;
        }
        // Mama Nkechi: food on credit for friends
        if (relOf(s, npcId) < 40) return "Mama: 'Credit? I don't even know you well yet.'";
        if (d - flag(s, "creditDay") < 2) return "Mama: 'You owe me from last time o. Next time.'";
        passTime(s, 20, "normal", notes);
        setFlag(s, "creditDay", d);
        add(s, "hunger", 35);
        rel(s, npcId, -2);
        return "Mama: 'Na only today o. Eat, my pikin.' (Hunger +35)";
      });
      if (line) set({ dialogLine: line });
    },

    travel: (mode, dest) => {
      const s0 = get().sim;
      if (!s0) return;
      const q = travelQuote(mode, dest, s0);
      const ok = mutate((s, notes) => {
        let price = q.price;
        if (mode === "danfo" && Math.random() < 0.25 && s.cash >= 500) {
          price = 500;
          notes.push("Conductor: 'Change dey later!' He never gave you your ₦200 change.");
        }
        const label = mode === "danfo" ? "Danfo fare" : mode === "keke" ? "Keke fare" : "GidiRide trip";
        if (!spend(s, price, q.pay, label)) {
          notes.push(q.pay === "cash" ? `You need ${naira(price)} in cash. Withdraw at the Naija Trust Bank ATM.` : `Not enough in your bank for this ride (${naira(price)}).`);
          return false;
        }
        passTime(s, q.minutes, "rest", notes);
        if (mode === "ride") add(s, "happiness", 3);
        if (mode === "danfo") add(s, "hygiene", -4);
        return true;
      });
      if (ok) {
        set({ modal: null });
        teleport(q.to);
      }
    },

    answerMessage: (id, choiceIdx) => {
      mutate((s, notes) => {
        const m = s.messages.find((x) => x.id === id);
        const c = m?.choices?.[choiceIdx];
        if (!m || !c || m.resolved) return;
        if (c.money && c.money < 0 && !spend(s, -c.money, "bank", `Sent to ${m.from}`)) {
          notes.push(`Not enough in your bank to send ${naira(-c.money)}.`);
          return;
        }
        if (c.happiness) add(s, "happiness", c.happiness);
        if (c.relation) rel(s, c.relation.npc, c.relation.amount);
        m.resolved = true;
        msg(s, m.thread, "You", c.reply, undefined, true);
        if (c.money && c.money < 0) msg(s, m.thread, m.from, pick(["God bless you, my child.", "Received. Thank you!", "Ah, see blessing! Thank you."]));
      });
    },

    bargain: (itemId) => {
      const item = CLOTHES.find((c) => c.id === itemId);
      const s = get().sim;
      if (!item || !s) return;
      const b = get().bargains[itemId];
      if (b?.tried) return;
      const friend = relOf(s, "iya_basira") >= 50;
      const ok = Math.random() < (friend ? 0.8 : 0.55);
      const price = ok ? Math.round((item.price * 0.75) / 100) * 100 : item.price;
      set({ bargains: { ...get().bargains, [itemId]: { price, tried: true } } });
      if (!ok) mutate((s) => rel(s, "iya_basira", -2));
      set({
        placeLog: [
          ok ? `Iya Basira: "Ehen, bring ${naira(price)}. Na because of you o."` : `Iya Basira: "Customer, you wan kill me? Price na ${naira(price)}, last."`,
          ...get().placeLog,
        ].slice(0, 5),
      });
    },

    buyClothes: (itemId) => {
      const item = CLOTHES.find((c) => c.id === itemId);
      const s0 = get().sim;
      if (!item || !s0) return;
      let price = get().bargains[itemId]?.price ?? item.price;
      if (relOf(s0, "iya_basira") >= 50) price = Math.round((price * 0.9) / 50) * 50;
      const line = mutate((s, notes) => {
        if (price > 0 && !spend(s, price, "any", `Yaba Market: ${item.label}`)) return `Not enough money for ${item.label} (${naira(price)}).`;
        passTime(s, 15, "normal", notes);
        s.appearance = { ...s.appearance, ...item.apply };
        add(s, "happiness", price > 0 ? 5 : 0);
        rel(s, "iya_basira", 1);
        return price > 0 ? `Bought ${item.label} for ${naira(price)}. You're wearing it now.` : "Done.";
      });
      if (line) set({ placeLog: [line, ...get().placeLog].slice(0, 5) });
    },

    haircut: (style) => {
      const s0 = get().sim;
      if (!s0) return;
      const price = relOf(s0, "bisi") >= 50 ? 2250 : 2500;
      const line = mutate((s, notes) => {
        if (!spend(s, price, "any", "Fresh Cutz: new hairstyle")) return `You need ${naira(price)} for a new style.`;
        passTime(s, 45, "normal", notes);
        s.appearance = { ...s.appearance, hair: style };
        add(s, "hygiene", 10);
        add(s, "happiness", 6);
        rel(s, "bisi", 2);
        return `Bisi: "See as you fine now!" New hairstyle done (−${naira(price)}).`;
      });
      if (line) set({ placeLog: [line, ...get().placeLog].slice(0, 5) });
    },

    atm: (op, amount) => {
      const line = mutate((s) => {
        if (op === "withdraw") {
          if (s.bank < amount) return "Insufficient funds.";
          if (Math.random() < 0.1) return "Unable to dispense cash. Please try again. (Your money was not taken.)";
          s.bank -= amount;
          s.cash += amount;
          s.txs.unshift({ time: s.time, label: "ATM withdrawal", amount: -amount, account: "bank" });
          return `Withdrew ${naira(amount)}. Count it before you leave.`;
        }
        if (s.cash < amount) return "You don't have that much cash.";
        s.cash -= amount;
        s.bank += amount;
        s.txs.unshift({ time: s.time, label: "Cash deposit", amount, account: "bank" });
        return `Deposited ${naira(amount)}.`;
      });
      if (line) set({ placeLog: [line, ...get().placeLog].slice(0, 5) });
    },

    payRentNow: () => {
      mutate((s, notes) => {
        const err = payRent(s);
        notes.push(err ?? `Rent paid. You're covered until Day ${s.rentPaidUntil + 1}.`);
      });
    },

    setWaypoint: (w) => mutate((s) => void (s.waypoint = w)),

    toast,

    updateSettings: (p) => {
      const settings = { ...get().settings, ...p };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        /* storage blocked */
      }
      set({ settings });
    },
  };
});
