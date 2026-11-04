// Phone controls: a virtual joystick on the left, jump / run / action buttons on the right.

import { useEffect, useRef, useState } from "react";
import { input } from "../game/input";
import { useGame } from "../game/store";
import { useTouchActive } from "./useTouchActive";

export function TouchControls() {
  const show = useTouchActive();
  const modal = useGame((s) => s.modal);
  const prompt = useGame((s) => s.prompt);
  const interact = useGame((s) => s.interact);
  const [run, setRun] = useState(false);
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);

  useEffect(() => {
    input.touchRun = run;
  }, [run]);

  if (!show || modal) return null;

  const update = (cx: number, cy: number) => {
    const r = base.current!.getBoundingClientRect();
    const R = r.width / 2;
    let dx = cx - (r.left + R);
    let dy = cy - (r.top + R);
    const len = Math.hypot(dx, dy);
    if (len > R) {
      dx = (dx / len) * R;
      dy = (dy / len) * R;
    }
    setKnob({ x: dx, y: dy });
    input.joyX = dx / R;
    input.joyY = -dy / R;
  };
  const reset = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    input.joyX = 0;
    input.joyY = 0;
  };

  return (
    <div className="touch">
      <div
        ref={base}
        className="joy"
        onPointerDown={(e) => {
          active.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          update(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => active.current === e.pointerId && update(e.clientX, e.clientY)}
        onPointerUp={reset}
        onPointerCancel={reset}
      >
        <div className="knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      <div className="touch-buttons">
        {prompt && (
          <button className={`tbtn act ${prompt.enabled ? "" : "off"}`} onPointerDown={(e) => { e.preventDefault(); interact(); }}>
            <b>{prompt.enabled ? prompt.verb || "USE" : "INFO"}</b>
            <span>{prompt.label}</span>
          </button>
        )}
        <button className={`tbtn ${run ? "on" : ""}`} onPointerDown={(e) => { e.preventDefault(); setRun((r) => !r); }}>
          RUN
        </button>
        <button className="tbtn" onPointerDown={(e) => { e.preventDefault(); input.jumpQueued = true; }}>
          JUMP
        </button>
      </div>
    </div>
  );
}
