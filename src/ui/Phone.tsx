// THE SMARTPHONE: Messages, Bank, GidiRide, Map, Profile, Diary and Settings.

import { useEffect, useRef } from "react";
import { BACKGROUNDS, HOMES } from "../game/data/backgrounds";
import { NPCS, tierLabel } from "../game/data/npcs";
import { runtime } from "../game/runtime";
import { travelDestinations, travelQuote, useGame, type PhoneApp } from "../game/store";
import { placePoint } from "../game/systems/interact";
import { relOf, rentStatus } from "../game/systems/sim";
import type { ThreadId } from "../game/types";
import { DAY_NAMES, clock, dayOf, naira, weekdayOf } from "../game/utils";
import { drawMap } from "./MapCanvas";
import { SaveSlots } from "./PauseMenu";
import { SettingsPanel } from "./SettingsPanel";

const THREADS: Record<ThreadId, { name: string; color: string }> = {
  family: { name: "Family Group", color: "#2FBF71" },
  landlord: { name: "Landlord", color: "#B5371F" },
  work: { name: "Yaba Mart (work)", color: "#D7261E" },
  school: { name: "Course Rep", color: "#4A2C17" },
  uncle: { name: "Uncle Dayo", color: "#6A3FA0" },
  tunde: { name: "Tunde", color: "#1F4E79" },
  chiamaka: { name: "Chiamaka", color: "#3FA7A0" },
  bank: { name: "NaijaTrust Alerts", color: "#0B5D3B" },
  stall: { name: "Iya Basira", color: "#C9653A" },
};

const APPS: { id: PhoneApp; name: string; color: string; glyph: string }[] = [
  { id: "messages", name: "Messages", color: "#2FBF71", glyph: "M" },
  { id: "bank", name: "NaijaTrust", color: "#0B5D3B", glyph: "₦" },
  { id: "ride", name: "GidiRide", color: "#F5B700", glyph: "G" },
  { id: "map", name: "Map", color: "#1F6FD1", glyph: "⌖" },
  { id: "profile", name: "Profile", color: "#9B7BE0", glyph: "P" },
  { id: "diary", name: "Diary", color: "#E46A8C", glyph: "D" },
  { id: "settings", name: "Settings", color: "#5C6166", glyph: "S" },
];

export function Phone() {
  const sim = useGame((s) => s.sim)!;
  const app = useGame((s) => s.phoneApp);
  const setApp = useGame((s) => s.setPhoneApp);
  const close = useGame((s) => s.closeModal);
  const unread = sim.messages.filter((m) => !m.read).length;

  return (
    <div className="sheet-wrap phone-wrap" onClick={close}>
      <section className="phone" onClick={(e) => e.stopPropagation()} aria-label="Phone">
        <div className="phone-status mono">
          <span>{clock(sim.time)}</span>
          <span>{sim.nepa ? "NEPA ●" : "No light ○"}</span>
        </div>
        <div className="phone-bar">
          {app !== "home" ? <button className="btn ghost" onClick={() => setApp("home")}>‹ Home</button> : <span className="phone-title">Yaba · Day {dayOf(sim.time) + 1}</span>}
          <button className="btn ghost" onClick={close}>Close</button>
        </div>
        <div className="phone-body">
          {app === "home" && (
            <div className="app-grid">
              {APPS.map((a) => (
                <button key={a.id} className="app-icon" onClick={() => setApp(a.id)}>
                  <i style={{ background: a.color }}>{a.glyph}</i>
                  <span>{a.name}</span>
                  {a.id === "messages" && unread > 0 && <em className="badge">{unread}</em>}
                </button>
              ))}
            </div>
          )}
          {app === "messages" && <Messages />}
          {app === "bank" && <Bank />}
          {app === "ride" && <Ride />}
          {app === "map" && <MapApp />}
          {app === "profile" && <Profile />}
          {app === "diary" && <Diary />}
          {app === "settings" && (
            <div className="phone-settings">
              <h3 className="h3">Save your life</h3>
              <SaveSlots />
              <SettingsPanel />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Messages() {
  const sim = useGame((s) => s.sim)!;
  const thread = useGame((s) => s.thread);
  const openThread = useGame((s) => s.openThread);
  const answer = useGame((s) => s.answerMessage);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView();
  }, [thread, sim.messages.length]);

  if (thread) {
    const list = sim.messages.filter((m) => m.thread === thread);
    return (
      <div className="chat">
        <button className="btn ghost small-btn" onClick={() => openThread(null)}>‹ All chats</button>
        <h3 className="h3">{THREADS[thread].name}</h3>
        <div className="bubbles">
          {list.map((m) => (
            <div key={m.id} className={`bubble ${m.mine ? "mine" : ""}`}>
              {!m.mine && <b>{m.from}</b>}
              <p>{m.text}</p>
              <span className="mono">Day {dayOf(m.time) + 1}, {clock(m.time)}</span>
              {m.choices && !m.resolved && (
                <div className="row">
                  {m.choices.map((c, i) => (
                    <button key={i} className="btn primary" onClick={() => answer(m.id, i)}>{c.label}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={bottom} />
        </div>
      </div>
    );
  }

  const threads = (Object.keys(THREADS) as ThreadId[])
    .map((t) => {
      const list = sim.messages.filter((m) => m.thread === t);
      return { t, last: list[list.length - 1], unread: list.filter((m) => !m.read).length };
    })
    .filter((x) => x.last)
    .sort((a, b) => b.last!.time - a.last!.time || b.last!.id - a.last!.id);

  return (
    <ul className="threads">
      {threads.map(({ t, last, unread }) => (
        <li key={t}>
          <button onClick={() => openThread(t)}>
            <i style={{ background: THREADS[t].color }}>{THREADS[t].name[0]}</i>
            <span>
              <b>{THREADS[t].name}</b>
              <small>{last!.mine ? "You: " : `${last!.from}: `}{last!.text}</small>
            </span>
            {unread > 0 && <em className="badge">{unread}</em>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Bank() {
  const sim = useGame((s) => s.sim)!;
  const payRent = useGame((s) => s.payRentNow);
  const rent = HOMES[sim.home].rent;
  return (
    <div className="bank">
      <div className="bank-card">
        <span>NaijaTrust · Savings</span>
        <b className="mono">{naira(sim.bank)}</b>
        <span className="mono">Cash in hand: {naira(sim.cash)}</span>
      </div>
      <div className="bank-rent">
        <p><b>Rent:</b> {rentStatus(sim)}</p>
        {rent > 0 && <button className="btn primary" onClick={payRent}>Pay rent ({naira(rent)})</button>}
      </div>
      <h3 className="h3">Recent transactions</h3>
      {sim.txs.length === 0 && <p className="muted small">No transactions yet.</p>}
      <ul className="txs">
        {sim.txs.slice(0, 25).map((t, i) => (
          <li key={i}>
            <span>
              {t.label}
              <small className="muted">Day {dayOf(t.time) + 1}, {clock(t.time)} · {t.account}</small>
            </span>
            <b className={`mono ${t.amount >= 0 ? "pos" : "neg"}`}>{t.amount >= 0 ? "+" : "−"}{naira(Math.abs(t.amount))}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ride() {
  const sim = useGame((s) => s.sim)!;
  const travel = useGame((s) => s.travel);
  return (
    <div>
      <p className="muted small">GidiRide picks you up where you are. Paid from your bank. Prices go up after 9 PM.</p>
      <div className="actions">
        {travelDestinations(sim).map((p) => {
          const q = travelQuote("ride", p.id, sim);
          return (
            <button key={p.id} className="action" onClick={() => travel("ride", p.id)}>
              <span className="action-main"><b>{p.home ? `Home (${HOMES[p.home].short})` : p.name}</b><span>{p.kind}</span></span>
              <span className="action-meta mono"><span>{naira(q.price)}</span><span>{q.minutes} min</span></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MapApp() {
  const sim = useGame((s) => s.sim)!;
  const setWaypoint = useGame((s) => s.setWaypoint);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let frame = 0;
    const draw = () => {
      const w = c.clientWidth;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (c.width !== w * dpr) {
        c.width = w * dpr;
        c.height = w * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawMap(ctx, w, w, { cx: 0, cz: 0, scale: w / 215, labels: true }, useGame.getState().sim);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="map-app">
      <canvas ref={ref} className="map-canvas" />
      <p className="small muted">Green = your home. Blue dots = bus stops. Yellow = people you know. Tap a place to set a waypoint.</p>
      {sim.waypoint && <button className="btn" onClick={() => setWaypoint(null)}>Clear waypoint ({sim.waypoint.label})</button>}
      <div className="chips">
        {travelDestinations(sim).map((p) => (
          <button
            key={p.id}
            className={`chip ${sim.waypoint?.label === (p.home ? HOMES[p.home].short : p.name) ? "on" : ""}`}
            onClick={() => {
              const pt = placePoint(p.id);
              setWaypoint({ x: pt.x, z: pt.z, label: p.home ? HOMES[p.home].short : p.name });
            }}
          >
            {p.home ? "Home" : p.name}
          </button>
        ))}
      </div>
      <p className="small muted mono">You are at {Math.round(runtime.player.x)}, {Math.round(runtime.player.z)}</p>
    </div>
  );
}

function Profile() {
  const sim = useGame((s) => s.sim)!;
  const met = NPCS.filter((n) => relOf(sim, n.id) > 0);
  const rep = met.reduce((a, n) => a + relOf(sim, n.id), 0);
  const repLabel = rep >= 400 ? "Yaba celebrity" : rep >= 220 ? "Well known" : rep >= 100 ? "Getting known" : "New in town";
  return (
    <div className="profile">
      <h3 className="h3">{sim.name}</h3>
      <p className="muted small">{BACKGROUNDS[sim.background].name} · lives at {HOMES[sim.home].name}</p>
      <p className="small">Reputation: <b>{repLabel}</b></p>
      <h3 className="h3">Skills</h3>
      {(["coding", "hustle", "fitness"] as const).map((k) => (
        <div key={k} className="skill">
          <span>{{ coding: "Coding", hustle: "Hustle", fitness: "Fitness" }[k]}</span>
          <div className="need-track"><i style={{ width: `${sim.skills[k] * 10}%`, background: "#F5B700" }} /></div>
          <b className="mono">{sim.skills[k].toFixed(1)}</b>
        </div>
      ))}
      <p className="small muted">Coding raises freelance pay. Hustle raises market pay. Fitness makes work less tiring.</p>
      <h3 className="h3">People</h3>
      {met.length === 0 && <p className="muted small">You haven't made any connections yet. Walk up to people and press E.</p>}
      <ul className="people">
        {met.map((n) => (
          <li key={n.id}>
            <span><b>{n.name}</b><small className="muted">{n.role}</small></span>
            <span className="small">{tierLabel(relOf(sim, n.id))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Diary() {
  const sim = useGame((s) => s.sim)!;
  const wd = weekdayOf(sim.time);
  const items: string[] = [];
  if (sim.background === "student") items.push("Lectures Mon–Fri at Akoka University, start between 8:30 AM and 12 PM.", "Allowance lands every Monday.");
  if (sim.background === "worker") items.push(sim.flags.fired ? "You no longer work at Yaba Mart." : "Yaba Mart shift Mon–Sat. Clock in 8–10 AM.");
  if (sim.background === "entrepreneur") items.push("Run your stall at Yaba Market (7 AM – 7 PM). Saturdays pay best.");
  if (sim.home === "uncle") items.push("Run an errand for Uncle Dayo at least every few days.");
  items.push(
    `Rent: ${rentStatus(sim)}`,
    "Wednesday 5–8 PM: fellowship at Grace Assembly.",
    "Sunday 7 AM – 12 PM: service at Grace Assembly.",
    "Every night 6 PM – 2 AM: Mallam Musa's suya.",
    "Weekends: big matches at Goal Zone.",
    `Fuel today: ${naira(sim.fuelPrice)} per litre (black market at Yaba Market costs more).`,
  );
  return (
    <div>
      <h3 className="h3">{DAY_NAMES[wd]}, Day {dayOf(sim.time) + 1}</h3>
      <ul className="diary">{items.map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  );
}
