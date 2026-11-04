import { useEffect, useState } from "react";
import { useGame } from "../game/store";

/** True when the on-screen joystick and buttons should show. */
export function useTouchActive() {
  const setting = useGame((s) => s.settings.touch);
  const [coarse, setCoarse] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const on = () => setCoarse(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return setting === "on" || (setting === "auto" && coarse);
}
