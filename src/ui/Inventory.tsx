import { ITEMS } from "../game/data/items";
import { useGame } from "../game/store";
import type { ItemId } from "../game/types";
import { naira } from "../game/utils";

export function Inventory() {
  const sim = useGame((s) => s.sim)!;
  const useItem = useGame((s) => s.useItem);
  const close = useGame((s) => s.closeModal);
  const items = (Object.keys(sim.inventory) as ItemId[]).filter((k) => (sim.inventory[k] ?? 0) > 0);

  return (
    <div className="sheet-wrap" onClick={close}>
      <section className="sheet narrow" onClick={(e) => e.stopPropagation()} aria-label="Your bag">
        <header className="sheet-head">
          <div>
            <p className="eyebrow">Your bag</p>
            <h2 className="h2">Inventory</h2>
            <p className="muted">Cash {naira(sim.cash)} · Bank {naira(sim.bank)}</p>
          </div>
          <button className="btn ghost" onClick={close}>Close</button>
        </header>
        {items.length === 0 && <p className="muted">Your bag is empty. Yaba Mart sells snacks and groceries.</p>}
        <div className="actions">
          {items.map((id) => {
            const it = ITEMS[id];
            const n = sim.inventory[id] ?? 0;
            return (
              <div key={id} className="action static">
                <span className="action-main">
                  <b>{it.name}{it.durable ? "" : ` ×${n}`}</b>
                  <span>{it.desc}{it.homeOnly ? " (at home)" : ""}</span>
                </span>
                {it.use ? (
                  <button className="btn primary" onClick={() => useItem(id)}>{it.useLabel ?? "Use"}</button>
                ) : (
                  <span className="small muted">{it.durable ? "Owned" : "Use at home"}</span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
