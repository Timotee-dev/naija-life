// THE IN-GAME SCREEN: the 3D canvas plus every overlay (HUD, prompts, panels, phone).

import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { attachInput } from "../game/input";
import { useGame } from "../game/store";
import { Scene } from "../three/Scene";
import { DialogPanel } from "./DialogPanel";
import { ErrorBoundary } from "./ErrorBoundary";
import { Hud, PromptBar, Toasts } from "./Hud";
import { Inventory } from "./Inventory";
import { Minimap } from "./Minimap";
import { PauseMenu } from "./PauseMenu";
import { Phone } from "./Phone";
import { PlacePanel } from "./PlacePanel";
import { StopPanel } from "./StopPanel";
import { TouchControls } from "./TouchControls";

export function GameScreen() {
  const settings = useGame((s) => s.settings);
  const modal = useGame((s) => s.modal);
  const fadeKey = useGame((s) => s.fadeKey);

  useEffect(() => attachInput(), []);

  return (
    <div className="game">
      <Canvas
        key={`${settings.shadows}-${settings.quality}`}
        className="game-canvas"
        shadows={settings.shadows}
        dpr={settings.quality === "high" ? [1, 1.75] : 1}
        gl={{ antialias: settings.quality === "high", powerPreference: "high-performance" }}
        camera={{ fov: 55, near: 0.1, far: 260, position: [10, 8, 10] }}
      >
        <Scene />
      </Canvas>
      <Hud />
      <Minimap />
      <PromptBar />
      <Toasts />
      <TouchControls />
      {fadeKey > 0 && <div key={fadeKey} className="fade" aria-hidden="true" />}
      <ErrorBoundary>
      {modal?.kind === "place" && <PlacePanel id={modal.id} sub={modal.sub} />}
      {modal?.kind === "npc" && <DialogPanel id={modal.id} />}
      {modal?.kind === "stop" && <StopPanel id={modal.id} />}
      {modal?.kind === "phone" && <Phone />}
      {modal?.kind === "inventory" && <Inventory />}
      {modal?.kind === "pause" && <PauseMenu />}
      </ErrorBoundary>
    </div>
  );
}
