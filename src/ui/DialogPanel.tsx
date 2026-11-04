import { NPC_BY_ID, tierLabel } from "../game/data/npcs";
import { useGame } from "../game/store";
import { relOf } from "../game/systems/sim";

export function DialogPanel({ id }: { id: string }) {
  const sim = useGame((s) => s.sim)!;
  const line = useGame((s) => s.dialogLine);
  const talk = useGame((s) => s.talk);
  const close = useGame((s) => s.closeModal);
  const npc = NPC_BY_ID[id];
  const rel = relOf(sim, id);

  return (
    <div className="dialog-wrap">
      <section className="dialog" aria-label={`Talking to ${npc.name}`}>
        <header>
          <div>
            <b className="dialog-name">{npc.name}</b>
            <span className="muted small">{npc.role}</span>
          </div>
          <div className="rel">
            <span className="small">{tierLabel(rel)}</span>
            <div className="rel-track"><i style={{ width: `${rel}%` }} /></div>
          </div>
        </header>
        <p className="speech">"{line}"</p>
        <div className="dialog-options">
          <button className="btn" onClick={() => talk(id, "greet")}>Greet <small>5 min</small></button>
          <button className="btn" onClick={() => talk(id, "gist")}>Gist <small>20 min · Social +12</small></button>
          <button className="btn" onClick={() => talk(id, "advice")}>Ask for advice</button>
          {id === "mama_nkechi" && <button className="btn" onClick={() => talk(id, "credit")}>Beg for food on credit</button>}
          <button className="btn primary" onClick={close}>Bye</button>
        </div>
        <p className="small muted">Talk every day to build the relationship. Gisting counts once per day.</p>
      </section>
    </div>
  );
}
