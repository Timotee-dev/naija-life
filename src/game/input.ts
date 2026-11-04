// KEYBOARD AND TOUCH INPUT. Stored in a plain object the player controller reads every frame.

import { useGame } from "./store";

export const input = {
  keys: new Set<string>(),
  joyX: 0, // -1 (left) … 1 (right), from the touch joystick
  joyY: 0, // -1 (back) … 1 (forward)
  jumpQueued: false,
  touchRun: false,
};

const MOVE_KEYS = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

export function attachInput(): () => void {
  const down = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
    const st = useGame.getState();
    if (st.screen !== "game") return;
    if (MOVE_KEYS.includes(e.code)) e.preventDefault();
    input.keys.add(e.code);
    if (e.repeat) return;

    if (e.code === "Space" && !st.modal) input.jumpQueued = true;
    if (e.code === "KeyE" && !st.modal) st.interact();
    if (e.code === "KeyP") {
      if (st.modal?.kind === "phone") st.closeModal();
      else if (!st.modal) st.openPhone("home");
    }
    if (e.code === "KeyI") {
      if (st.modal?.kind === "inventory") st.closeModal();
      else if (!st.modal) st.openModal({ kind: "inventory" });
    }
    if (e.code === "Escape") {
      if (st.modal) st.closeModal();
      else st.openModal({ kind: "pause" });
    }
  };
  const up = (e: KeyboardEvent) => input.keys.delete(e.code);
  const clear = () => input.keys.clear();

  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", clear);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", clear);
  };
}
