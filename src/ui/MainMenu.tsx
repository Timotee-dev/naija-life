import { useState } from "react";
import { BACKGROUNDS } from "../game/data/backgrounds";
import { useGame } from "../game/store";
import { latestSave, listSaves, type SaveMeta } from "../game/systems/save";
import { DAY_NAMES, clock, dayOf, naira, weekdayOf } from "../game/utils";
import { SettingsPanel } from "./SettingsPanel";

export function MainMenu() {
  const goto = useGame((s) => s.goto);
  const loadGame = useGame((s) => s.loadGame);
  const [panel, setPanel] = useState<null | "load" | "settings">(null);
  const last = latestSave();

  return (
    <div className="menu">
      <div className="menu-stripes" aria-hidden="true" />
      <div className="menu-inner">
        <p className="eyebrow">Prototype · Yaba, Lagos</p>
        <h1 className="logo">
          NAIJA
          <br />
          LIFE
        </h1>
        <p className="tagline">Your Life. Your Lagos. Your Rules.</p>

        {!panel && (
          <div className="menu-buttons">
            <button className="btn primary big" onClick={() => goto("create")}>New Game</button>
            {last && (
              <button className="btn big" onClick={() => loadGame(last.slot)}>
                Continue <small>{last.name} · {saveWhen(last)}</small>
              </button>
            )}
            <button className="btn big" onClick={() => setPanel("load")}>Load Game</button>
            <button className="btn big" onClick={() => setPanel("settings")}>Settings</button>
          </div>
        )}
        {panel === "load" && <LoadPanel onBack={() => setPanel(null)} />}
        {panel === "settings" && (
          <div className="card menu-card">
            <SettingsPanel />
            <button className="btn" onClick={() => setPanel(null)}>Back</button>
          </div>
        )}
      </div>
      <p className="menu-foot">A work of fiction. Places and people are made up; Yaba vibes are real.</p>
    </div>
  );
}

function saveWhen(m: SaveMeta) {
  return `Day ${dayOf(m.time) + 1}, ${DAY_NAMES[weekdayOf(m.time)]} ${clock(m.time)}`;
}

function LoadPanel({ onBack }: { onBack: () => void }) {
  const loadGame = useGame((s) => s.loadGame);
  const removeSave = useGame((s) => s.removeSave);
  const [saves, setSaves] = useState(listSaves);
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <div className="card menu-card">
      <h2 className="h2">Load game</h2>
      {saves.length === 0 && <p className="muted">No saved lives yet. Start a new game.</p>}
      <ul className="save-list">
        {saves.map((m) => (
          <li key={m.slot}>
            <div>
              <b>{m.slot === "auto" ? "Autosave" : `Slot ${m.slot}`}: {m.name}</b>
              <span className="muted">
                {BACKGROUNDS[m.background].name} · {saveWhen(m)} · {naira(m.cash + m.bank)}
              </span>
            </div>
            <div className="row">
              <button className="btn primary" onClick={() => loadGame(m.slot)}>Load</button>
              {confirm === m.slot ? (
                <button
                  className="btn danger"
                  onClick={() => {
                    removeSave(m.slot);
                    setSaves(listSaves());
                    setConfirm(null);
                  }}
                >
                  Confirm delete
                </button>
              ) : (
                <button className="btn ghost" onClick={() => setConfirm(m.slot)}>Delete</button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <button className="btn" onClick={onBack}>Back</button>
    </div>
  );
}
