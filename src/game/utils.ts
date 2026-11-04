export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const dist = (ax: number, az: number, bx: number, bz: number) => Math.hypot(ax - bx, az - bz);

export const naira = (n: number) => (n < 0 ? "-₦" : "₦") + Math.abs(Math.round(n)).toLocaleString("en-NG");

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const dayOf = (t: number) => Math.floor(t / 1440);
export const hourOf = (t: number) => (((t % 1440) + 1440) % 1440) / 60;
export const weekdayOf = (t: number) => dayOf(t) % 7;

export function clock(t: number) {
  const m = Math.floor(((t % 1440) + 1440) % 1440);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function hourLabel(h: number) {
  const hh = ((Math.floor(h) % 24) + 24) % 24;
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12} ${hh < 12 ? "AM" : "PM"}`;
}

/** hours = [open, close]. close > 24 means it closes after midnight (e.g. [18, 26] = 6 PM – 2 AM). */
export function isOpen(hours: [number, number] | undefined, t: number) {
  if (!hours) return true;
  const h = hourOf(t);
  const [o, c] = hours;
  return c > 24 ? h >= o || h < c - 24 : h >= o && h < c;
}

export function hoursLabel(hours: [number, number] | undefined) {
  if (!hours) return "Open 24 hours";
  return `${hourLabel(hours[0])} – ${hourLabel(hours[1])}`;
}

/** A tiny seeded random generator: same seed, same numbers. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
