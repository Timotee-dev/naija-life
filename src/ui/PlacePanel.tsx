// INSIDE A PLACE: every action with its price and time, plus special screens (clothes, barber, ATM).

import { HAIRS, HAIR_LABELS } from "../game/data/appearance";
import { HOMES } from "../game/data/backgrounds";
import { CLOTHES } from "../game/data/clothes";
import { NPC_BY_ID } from "../game/data/npcs";
import { PLACES, val } from "../game/data/places";
import { effectivePrice, useGame } from "../game/store";
import { relOf, rentStatus } from "../game/systems/sim";
import { hoursLabel, naira } from "../game/utils";
import { NeedBar } from "./Hud";

function timeLabel(m: number) {
  if (m <= 0) return "";
  if (m >= 60) {
    const h = Math.round((m / 60) * 10) / 10;
    return `${h} h`;
  }
  return `${m} min`;
}

export function PlacePanel({ id, sub }: { id: string; sub?: "clothes" | "barber" | "atm" }) {
  const sim = useGame((s) => s.sim)!;
  const log = useGame((s) => s.placeLog);
  const close = useGame((s) => s.closeModal);
  const doAction = useGame((s) => s.doAction);
  const openModal = useGame((s) => s.openModal);
  const place = PLACES[id];
  const owner = place.owner ? NPC_BY_ID[place.owner] : null;
  const friendly = owner && relOf(sim, owner.id) >= 50;

  return (
    <div className="sheet-wrap" onClick={close}>
      <section className="sheet place" onClick={(e) => e.stopPropagation()} aria-label={place.name}>
        <header className="sheet-head">
          <div>
            <p className="eyebrow">{place.kind} · {place.home ? "Your home" : hoursLabel(place.hours)}</p>
            <h2 className="h2">{place.name}</h2>
            <p className="muted">{place.desc}</p>
            {place.home && <p className="small rent">{rentStatus(sim)}</p>}
            {owner && <p className="small">{friendly ? `${owner.name} is your friend: 10% off everything here.` : `Make friends with ${owner.name} for 10% off.`}</p>}
          </div>
          <button className="btn ghost" onClick={sub ? () => openModal({ kind: "place", id }) : close}>{sub ? "Back" : "Leave"}</button>
        </header>

        <div className="sheet-stats">
          <span className="mono">Cash {naira(sim.cash)}</span>
          <span className="mono">Bank {naira(sim.bank)}</span>
          <NeedBar k="hunger" value={sim.needs.hunger} compact />
          <NeedBar k="energy" value={sim.needs.energy} compact />
        </div>

        {log.length > 0 && (
          <ul className="log">
            {log.map((l, i) => (
              <li key={i} className={i === 0 ? "latest" : ""}>{l}</li>
            ))}
          </ul>
        )}

        {sub === "clothes" && <ClothesShop />}
        {sub === "barber" && <Barber />}
        {sub === "atm" && <Atm />}
        {!sub && (
          <div className="actions">
            {place.actions.map((a) => {
              const why = a.available?.(sim) ?? null;
              const price = effectivePrice(id, a.id, sim);
              const minutes = val(a.minutes, sim);
              const detail = val(a.detail, sim);
              return (
                <button key={a.id} className={`action ${why ? "unavailable" : ""}`} onClick={() => doAction(id, a.id)}>
                  <span className="action-main">
                    <b>{a.label}</b>
                    <span>{detail}</span>
                    {why && <em>{why}</em>}
                  </span>
                  <span className="action-meta mono">
                    {price > 0 && <span>{naira(price)}{a.pay === "cash" ? " cash" : a.pay === "bank" ? " bank" : ""}</span>}
                    {minutes > 0 && <span>{timeLabel(minutes)}</span>}
                    {!price && !minutes && <span>Open</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {place.home && !sub && <p className="small muted">This is {HOMES[place.home].name}. Use items from your bag with I.</p>}
      </section>
    </div>
  );
}

function ClothesShop() {
  const sim = useGame((s) => s.sim)!;
  const bargains = useGame((s) => s.bargains);
  const bargain = useGame((s) => s.bargain);
  const buy = useGame((s) => s.buyClothes);
  const friend = relOf(sim, "iya_basira") >= 50;
  return (
    <div className="actions">
      <p className="small muted">Iya Basira's first price is never her last price. Price am once per item. Too cheeky and she'll vex.</p>
      {CLOTHES.map((c) => {
        const b = bargains[c.id];
        let price = b?.price ?? c.price;
        if (friend) price = Math.round((price * 0.9) / 50) * 50;
        const wearing = Object.entries(c.apply).every(([k, v]) => sim.appearance[k as keyof typeof sim.appearance] === v);
        return (
          <div key={c.id} className="action static">
            <span className="action-main">
              <b>{c.label}</b>
              <span className="mono">{price ? naira(price) : "Free"}{b && b.price < c.price ? " (bargained)" : ""}</span>
              {wearing && <em className="ok">Wearing it</em>}
            </span>
            <span className="row">
              {c.price > 0 && (
                <button className="btn ghost" disabled={!!b?.tried} onClick={() => bargain(c.id)}>
                  {b?.tried ? "Priced" : "Price am"}
                </button>
              )}
              <button className="btn primary" disabled={wearing} onClick={() => buy(c.id)}>{c.price ? "Buy & wear" : "Apply"}</button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Barber() {
  const sim = useGame((s) => s.sim)!;
  const haircut = useGame((s) => s.haircut);
  const price = relOf(sim, "bisi") >= 50 ? 2250 : 2500;
  return (
    <div className="actions">
      <p className="small muted">Every style costs {naira(price)} and takes 45 minutes.</p>
      {HAIRS.map((h) => (
        <button key={h} className="action" disabled={sim.appearance.hair === h} onClick={() => haircut(h)}>
          <span className="action-main">
            <b>{HAIR_LABELS[h]}</b>
            {sim.appearance.hair === h && <em className="ok">Your current style</em>}
          </span>
          <span className="action-meta mono">{naira(price)}</span>
        </button>
      ))}
    </div>
  );
}

function Atm() {
  const sim = useGame((s) => s.sim)!;
  const atm = useGame((s) => s.atm);
  const amounts = [2000, 5000, 10000, 20000];
  return (
    <div className="atm">
      <div className="atm-screen mono">
        <span>NAIJA TRUST BANK</span>
        <b>Balance: {naira(sim.bank)}</b>
        <span>Cash in hand: {naira(sim.cash)}</span>
      </div>
      <p className="label">Withdraw</p>
      <div className="chips">
        {amounts.map((a) => (
          <button key={a} className="btn" disabled={sim.bank < a} onClick={() => atm("withdraw", a)}>{naira(a)}</button>
        ))}
      </div>
      <p className="label">Deposit</p>
      <div className="chips">
        {amounts.map((a) => (
          <button key={a} className="btn" disabled={sim.cash < a} onClick={() => atm("deposit", a)}>{naira(a)}</button>
        ))}
      </div>
    </div>
  );
}
