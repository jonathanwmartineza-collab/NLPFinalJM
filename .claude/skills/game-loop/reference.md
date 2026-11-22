# Game Loop — reference code

Linked from [SKILL.md](SKILL.md). Plain TypeScript, no library. The timestep pattern follows Glenn
Fiedler, "Fix Your Timestep!" https://gafferongames.com/post/fix_your_timestep/ (accessed 2026-11-21).

## 1. Fixed-timestep loop with interpolation and pause
```ts
const STEP = 1 / 60;          // seconds per logic tick
const MAX_DT = 0.25;          // clamp after stalls (tab switch, breakpoint)
const MAX_STEPS = 5;          // never run more than this many ticks per frame

type Scene = { update(dt: number): void; render(alpha: number): void };

export function startLoop(scene: Scene) {
  let last = -1, acc = 0, rafId = 0, paused = false;

  function frame(nowMs: number) {
    rafId = requestAnimationFrame(frame);
    const now = nowMs / 1000;
    if (last < 0 || paused) { last = now; scene.render(0); return; }
    acc += Math.min(now - last, MAX_DT);
    last = now;
    let steps = 0;
    while (acc >= STEP && steps < MAX_STEPS) { scene.update(STEP); acc -= STEP; steps++; }
    if (steps === MAX_STEPS) acc = 0;               // drop backlog instead of spiralling
    scene.render(acc / STEP);                        // alpha in [0,1) for interpolation
  }

  const onVisibility = () => { paused = document.hidden; last = -1; };
  document.addEventListener("visibilitychange", onVisibility);
  rafId = requestAnimationFrame(frame);
  return {
    pause() { paused = true; },
    resume() { paused = false; last = -1; },
    stop() { cancelAnimationFrame(rafId); document.removeEventListener("visibilitychange", onVisibility); },
  };
}
```
Interpolate in render: `drawX = prevX + (x - prevX) * alpha`, where `prevX` is saved at the start of
each `update`.

## 2. Input buffer (Pointer Events + keyboard)
```ts
export const input = { down: new Set<string>(), pressed: new Set<string>(), pointer: { x: 0, y: 0, down: false } };
const bindings: Record<string, string> = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
                                            Space: "jump", Escape: "pause", KeyP: "pause" }; // remappable
addEventListener("keydown", e => { const a = bindings[e.code]; if (!a) return;
  if (!input.down.has(a)) input.pressed.add(a); input.down.add(a); if (a !== "pause") e.preventDefault(); });
addEventListener("keyup", e => { const a = bindings[e.code]; if (a) input.down.delete(a); });
export function bindPointer(canvas: HTMLCanvasElement, toGame: (x: number, y: number) => { x: number; y: number }) {
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", e => { canvas.setPointerCapture(e.pointerId); input.pointer.down = true; input.pressed.add("tap"); Object.assign(input.pointer, toGame(e.offsetX, e.offsetY)); });
  canvas.addEventListener("pointermove", e => Object.assign(input.pointer, toGame(e.offsetX, e.offsetY)));
  canvas.addEventListener("pointerup", () => { input.pointer.down = false; });
}
export const endFrameInput = () => input.pressed.clear();   // call after each update tick
```

## 3. DPR-correct canvas with fixed virtual resolution
```ts
export function fitCanvas(canvas: HTMLCanvasElement, vw = 320, vh = 180) {
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const view = { scale: 1, ox: 0, oy: 0 };
  const ro = new ResizeObserver(() => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    view.scale = Math.min(canvas.width / vw, canvas.height / vh);           // letterbox
    view.ox = (canvas.width - vw * view.scale) / 2; view.oy = (canvas.height - vh * view.scale) / 2;
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox, view.oy);
    ctx.imageSmoothingEnabled = false;                                       // pixel art
  });
  ro.observe(canvas);
  return { ctx, view };
}
```

## 4. Seeded PRNG (mulberry32)
```ts
export function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
```

## 5. Object pool
```ts
export class Pool<T> {
  private free: T[] = [];
  constructor(private make: () => T, private reset: (o: T) => void, prefill = 64) {
    for (let i = 0; i < prefill; i++) this.free.push(make()); }
  get(): T { return this.free.pop() ?? this.make(); }
  release(o: T) { this.reset(o); this.free.push(o); }
}
```

## 6. Reduced motion and audio unlock
```ts
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
export const motion = { shake: !reduceMotion.matches, particles: reduceMotion.matches ? 0.3 : 1 };
reduceMotion.addEventListener("change", e => { motion.shake = !e.matches; motion.particles = e.matches ? 0.3 : 1; });

let audio: AudioContext | null = null;
export function unlockAudio() { audio ??= new AudioContext(); if (audio.state === "suspended") audio.resume(); }
addEventListener("pointerdown", unlockAudio, { once: true });
addEventListener("keydown", unlockAudio, { once: true });
```

## 7. Unit test shape (Vitest)
```ts
import { describe, it, expect } from "vitest";
import { createGame } from "../src/game";
it("ends the game when the player hits a wall", () => {
  const g = createGame({ seed: 42 });
  g.state.player.x = 0; g.state.player.vx = -100;
  for (let i = 0; i < 10; i++) g.update(1 / 60);
  expect(g.state.mode).toBe("gameover");
});
```
