import { useState } from "react";
import { STOPS } from "../game/data/map";
import { travelDestinations, travelQuote, useGame } from "../game/store";
import { naira } from "../game/utils";

export function StopPanel({ id }: { id: string }) {
  const sim = useGame((s) => s.sim)!;
  const travel = useGame((s) => s.travel);
  const close = useGame((s) => s.closeModal);
  const [mode, setMode] = useState<"danfo" | "keke">("danfo");
  const stop = STOPS.find((s) => s.id === id)!;

  return (
    <div className="sheet-wrap" onClick={close}>
      <section className="sheet" onClick={(e) => e.stopPropagation()} aria-label={stop.name}>
        <header className="sheet-head">
          <div>
            <p className="eyebrow">Transport · cash only</p>
            <h2 className="h2">{stop.name}</h2>
            <p className="muted">Kunle the conductor is shouting destinations. You have <b className="mono">{naira(sim.cash)}</b> in cash.</p>
          </div>
          <button className="btn ghost" onClick={close}>Leave</button>
        </header>
        <div className="seg wide">
          <button className={mode === "danfo" ? "on" : ""} onClick={() => setMode("danfo")}>Danfo · ₦300 · bus stops only</button>
          <button className={mode === "keke" ? "on" : ""} onClick={() => setMode("keke")}>Keke · drops you anywhere</button>
        </div>
        <div className="actions">
          {mode === "danfo" &&
            STOPS.filter((s) => s.id !== id).map((s) => {
              const q = travelQuote("danfo", s.id, sim);
              return (
                <button key={s.id} className="action" onClick={() => travel("danfo", s.id)}>
                  <span className="action-main"><b>{s.name}</b><span>Slow, crowded, cheap. Conductor may not have change.</span></span>
                  <span className="action-meta mono"><span>{naira(q.price)}</span><span>{q.minutes} min</span></span>
                </button>
              );
            })}
          {mode === "keke" &&
            travelDestinations(sim).map((p) => {
              const q = travelQuote("keke", p.id, sim);
              return (
                <button key={p.id} className="action" onClick={() => travel("keke", p.id)}>
                  <span className="action-main"><b>{p.home ? "Home" : p.name}</b><span>{p.kind}</span></span>
                  <span className="action-meta mono"><span>{naira(q.price)}</span><span>{q.minutes} min</span></span>
                </button>
              );
            })}
        </div>
        <p className="small muted">Need cash? Use the Naija Trust Bank ATM. Prefer comfort? Book a GidiRide on your phone (paid from your bank).</p>
      </section>
    </div>
  );
}
