// THIRD-PERSON CAMERA: follows the player. Drag to rotate, scroll or pinch to zoom.

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { runtime } from "../game/runtime";
import { clamp } from "../game/utils";

export function CameraRig() {
  const { camera, gl } = useThree();
  const st = useRef({ yaw: Math.PI * 0.5, pitch: 0.42, dist: 10.5 });
  const target = useRef(new THREE.Vector3());

  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const down = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      if (pointers.size === 2) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) st.current.dist = clamp(st.current.dist * (pinch / d), 5, 24);
        pinch = d;
        return;
      }
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      st.current.yaw -= dx * 0.006;
      st.current.pitch = clamp(st.current.pitch + dy * 0.004, 0.12, 1.25);
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      pinch = 0;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      st.current.dist = clamp(st.current.dist * (1 + Math.sign(e.deltaY) * 0.1), 5, 24);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl]);

  useFrame((_, dt) => {
    if (runtime.cameraYawRequest !== null) {
      st.current.yaw = runtime.cameraYawRequest;
      runtime.cameraYawRequest = null;
    }
    const p = runtime.player;
    const { yaw, pitch, dist } = st.current;
    const goal = new THREE.Vector3(p.x, p.y * 0.5 + 1.5, p.z);
    const k = runtime.snapCamera ? 1 : 1 - Math.exp(-dt * 10);
    target.current.lerp(goal, k);
    const desired = new THREE.Vector3(
      target.current.x + Math.sin(yaw) * Math.cos(pitch) * dist,
      target.current.y + Math.sin(pitch) * dist,
      target.current.z + Math.cos(yaw) * Math.cos(pitch) * dist,
    );
    camera.position.lerp(desired, runtime.snapCamera ? 1 : 1 - Math.exp(-dt * 8));
    camera.lookAt(target.current);
    runtime.snapCamera = false;
    runtime.cameraYaw = yaw;
  });

  return null;
}
