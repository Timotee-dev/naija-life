import { useEffect, useRef } from "react";
import { runtime } from "../game/runtime";
import { useGame } from "../game/store";
import { drawMap } from "./MapCanvas";

export function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const openPhone = useGame((s) => s.openPhone);

  useEffect(() => {
    let frame = 0;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const draw = () => {
      const size = canvas.clientWidth;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawMap(ctx, size, size, { cx: runtime.player.x, cz: runtime.player.z, scale: size / 110, labels: false }, useGame.getState().sim);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <button className="minimap" onClick={() => openPhone("map")} aria-label="Open map">
      <canvas ref={ref} />
      <span className="minimap-n">N</span>
    </button>
  );
}
