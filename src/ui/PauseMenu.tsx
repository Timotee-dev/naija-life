import { useState } from "react";
import { useGame } from "../game/store";
import { listSaves, type Slot } from "../game/systems/save";
import { DAY_NAMES, clock, dayOf, weekdayOf } from "../game/utils";
import { SettingsPanel } from "./SettingsPanel";

export function SaveSlots() {
  const save = useGame((s) => s.saveGame);
  const [saves, setSaves] = useState(listSaves);
  return (
    <div className="actions">
      {(["1", "2", "3"] as Slot[]).map((slot) => {
        const m = saves.find((x) => x.slot === slot);
        return (
          <button
            key={slot}
            className="action"
            onClick={() => {
              save(slot);
              setSaves(listSaves());
            }}
          >
            <span className="action-main">
              <b>Save to slot {slot}</b>
              <span>{m ? `Overwrites: ${m.name}, Day ${dayOf(m.time) + 1} ${DAY_NAMES[weekdayOf(m.time)]} ${clock(m.time)}` : "Empty"}</span>
            </span>
          </button>
        );
      })}
      <p className="small muted">The game also autosaves every minute and when you quit.</p>
    </div>
  );
}

export function PauseMenu() {
  const close = useGame((s) => s.closeModal);
  const quit = useGame((s) => s.quitToMenu);
  const [view, setView] = useState<"main" | "save" | "settings" | "controls">("main");

  return (
    <div className="sheet-wrap">
      <section className="sheet narrow" aria-label="Paused">
        <header className="sheet-head">
          <div>
            <p className="eyebrow">Paused</p>
            <h2 className="h2">{{ main: "Menu", save: "Save game", settings: "Settings", controls: "Controls" }[view]}</h2>
          </div>
          {view !== "main" && <button className="btn ghost" onClick={() => setView("main")}>Back</button>}
        </header>
        {view === "main" && (
          <div className="menu-buttons">
            <button className="btn primary big" onClick={close}>Resume</button>
            <button className="btn big" onClick={() => setView("save")}>Save game</button>
            <button className="btn big" onClick={() => setView("settings")}>Settings</button>
            <button className="btn big" onClick={() => setView("controls")}>Controls</button>
            <button className="btn big" onClick={quit}>Save & quit to main menu</button>
          </div>
        )}
        {view === "save" && <SaveSlots />}
        {view === "settings" && <SettingsPanel />}
        {view === "controls" && (
          <ul className="controls-list">
            <li><kbd>W A S D</kbd> or arrows: walk</li>
            <li><kbd>Shift</kbd>: run (uses more energy)</li>
            <li><kbd>Space</kbd>: jump</li>
            <li><kbd>E</kbd>: enter, talk, board</li>
            <li><kbd>P</kbd>: phone · <kbd>I</kbd>: bag · <kbd>Esc</kbd>: menu</li>
            <li>Drag the screen to turn the camera. Scroll or pinch to zoom.</li>
            <li>On a phone: joystick to walk (push all the way to run), buttons for jump and action.</li>
          </ul>
        )}
      </section>
    </div>
  );
}
