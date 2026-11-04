import { useGame } from "../game/store";
import type { NeedKey } from "../game/types";
import { DAY_NAMES, clock, dayOf, naira, weekdayOf } from "../game/utils";
import { BACKGROUNDS } from "../game/data/backgrounds";
import { useTouchActive } from "./useTouchActive";

const NEEDS: { key: NeedKey; label: string; color: string }[] = [
  { key: "health", label: "Health", color: "#E5533D" },
  { key: "hunger", label: "Hunger", color: "#F28C28" },
  { key: "energy", label: "Energy", color: "#F5C400" },
  { key: "happiness", label: "Happy", color: "#E46A8C" },
  { key: "hygiene", label: "Hygiene", color: "#3FB8C9" },
  { key: "social", label: "Social", color: "#9B7BE0" },
];

export function NeedBar({ k, value, compact = false }: { k: NeedKey; value: number; compact?: boolean }) {
  const n = NEEDS.find((x) => x.key === k)!;
  const low = value < 25;
  return (
    <div className={`need ${low ? "low" : ""} ${compact ? "compact" : ""}`} title={`${n.label}: ${Math.round(value)}`}>
      <span>{n.label}</span>
      <div className="need-track">
        <i style={{ width: `${value}%`, background: n.color }} />
      </div>
    </div>
  );
}

export function Hud() {
  const sim = useGame((s) => s.sim);
  const openPhone = useGame((s) => s.openPhone);
  const openModal = useGame((s) => s.openModal);
  if (!sim) return null;
  const unread = sim.messages.filter((m) => !m.read).length;
  const genOn = sim.genUntil > sim.time;
  const initials = sim.name.slice(0, 2).toUpperCase();

  return (
    <>
      <div className="hud-left">
        <div className="who">
          <div className="portrait" style={{ background: sim.appearance.skin }}>
            <span>{initials}</span>
          </div>
          <div>
            <b>{sim.name}</b>
            <span className="muted small">{BACKGROUNDS[sim.background].name}</span>
          </div>
        </div>
        <div className="needs">
          {NEEDS.map((n) => (
            <NeedBar key={n.key} k={n.key} value={sim.needs[n.key]} />
          ))}
        </div>
      </div>

      <div className="hud-right">
        <div className="clock">
          <b className="mono">{clock(sim.time)}</b>
          <span>{DAY_NAMES[weekdayOf(sim.time)]} · Day {dayOf(sim.time) + 1}</span>
        </div>
        <div className={`power ${sim.nepa ? "on" : "off"}`}>
          {sim.nepa ? "NEPA: light dey" : genOn ? "No NEPA · gen on" : "NEPA: no light"}
        </div>
        <div className="money mono">
          <span><em>Cash</em>{naira(sim.cash)}</span>
          <span><em>Bank</em>{naira(sim.bank)}</span>
        </div>
        {sim.waypoint && <div className="wp">Going to: {sim.waypoint.label}</div>}
        <div className="hud-buttons">
          <button className="hud-btn" onClick={() => openPhone("home")} aria-label="Phone (P)">
            Phone <kbd>P</kbd>
            {unread > 0 && <i className="badge">{unread}</i>}
          </button>
          <button className="hud-btn" onClick={() => openModal({ kind: "inventory" })} aria-label="Bag (I)">
            Bag <kbd>I</kbd>
          </button>
          <button className="hud-btn" onClick={() => openModal({ kind: "pause" })} aria-label="Menu (Esc)">
            Menu <kbd>Esc</kbd>
          </button>
        </div>
      </div>
    </>
  );
}

export function PromptBar() {
  const prompt = useGame((s) => s.prompt);
  const modal = useGame((s) => s.modal);
  const interact = useGame((s) => s.interact);
  const touch = useTouchActive();
  if (!prompt || modal || touch) return null;
  return (
    <button className={`prompt ${prompt.enabled ? "" : "disabled"}`} onClick={interact}>
      {prompt.enabled && <kbd>E</kbd>}
      <span>
        {prompt.verb && <b>{prompt.verb}</b>} {prompt.label}
        {prompt.sub && <small>{prompt.sub}</small>}
      </span>
    </button>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">{t.text}</div>
      ))}
    </div>
  );
}
