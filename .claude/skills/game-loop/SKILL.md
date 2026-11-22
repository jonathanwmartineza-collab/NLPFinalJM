---
name: "game-loop"
description: "Use when building or fixing a browser game, canvas or WebGL animation, simulation or any real-time interactive piece that must run smoothly on phones and desktops. Produces a fixed-timestep loop with state machine, input buffer, DPR-correct canvas, pause/visibility handling, accessibility options and a measured frame-budget report."
---
# Game Loop

## Purpose
Make real-time pieces feel the same on a 60 Hz phone and a 144 Hz monitor: logic runs at a fixed rate,
rendering runs as fast as the display allows, nothing allocates per frame, and the game pauses when the
tab is hidden. Copy-ready code for every step is in [reference.md](reference.md).

## Procedure
1. **Write the one-line core loop.** "Player <verb>s to <goal> while <pressure>." Add: win/lose
   conditions, session length, target devices, input methods (keyboard, pointer/touch, gamepad).
2. **Set the frame budget.** 60 fps = 16.7 ms per frame, 120 fps = 8.3 ms. Target ≤8 ms of script +
   render work per frame on a mid-range phone so there is headroom. Never assume the display is 60 Hz.
3. **Build a state machine:** `boot → menu → playing ⇄ paused → gameover → menu`. Each state has
   `enter`, `update(dt)`, `render(alpha)`, `exit`. No game logic in event handlers.
4. **Use a fixed-timestep loop** (Glenn Fiedler, "Fix Your Timestep!",
   https://gafferongames.com/post/fix_your_timestep/):
   - `requestAnimationFrame` drives the loop; use its timestamp, in seconds.
   - Add the frame's elapsed time to an accumulator; run `update(STEP)` while accumulator ≥ STEP
     (STEP = 1/60 s); render with `alpha = accumulator / STEP` to interpolate positions.
   - Clamp elapsed time (≤0.25 s) and cap updates per frame (≤5) to avoid the "spiral of death".
5. **Pause correctly.** Listen to `visibilitychange`; when `document.hidden`, enter `paused` and stop
   accumulating; on resume reset the last timestamp so there is no giant jump. Also pause on `blur` and
   with Escape/P. Show a clear paused overlay with a Resume button.
6. **Buffer input.** Event listeners only write to an input state object (keys down, pointer position,
   "pressed this frame" flags); `update` reads it and clears per-frame flags. Use Pointer Events (one code
   path for mouse, touch, pen), `touch-action: none` on the canvas, and `preventDefault` only on the
   canvas. Provide remappable keys and on-screen controls for touch.
7. **Size the canvas for the screen.** Backing store = CSS size × `devicePixelRatio` (cap at 2 for cost),
   scale the context once, resize via `ResizeObserver`. Keep game coordinates in a fixed virtual
   resolution and scale to fit (letterbox) so physics never depends on window size.
8. **Render efficiently.** Draw static layers once to an offscreen canvas; use sprite atlases; batch by
   texture/state; avoid `save/restore` and font changes in hot paths; skip drawing off-screen entities.
   Move to WebGL (or a library such as PixiJS) when 2D canvas drops frames with your sprite counts.
9. **Stop allocating per frame.** Pool bullets, particles and vectors; reuse arrays; no closures or
   object literals inside `update`/`render`. Garbage-collection pauses show up as periodic hitches.
10. **Make it deterministic.** All randomness from a seeded PRNG; `update` depends only on
    (state, input, STEP). This enables replays, fair daily seeds and unit tests.
11. **Audio.** Web Audio API; create/resume the `AudioContext` on the first user gesture; mute toggle
    and volume saved in settings; never autoplay sound on load.
12. **Accessibility and comfort.** Honour `prefers-reduced-motion` (no screen shake, softer particles,
    no parallax); never flash more than 3 times per second (WCAG 2.3.1); pause at any time; colour-blind
    safe palette plus shapes; adjustable speed or difficulty; captions or visual cues for audio events;
    keyboard-operable menus with visible focus; the canvas has an accessible name and the score is mirrored
    in an `aria-live="polite"` element (throttled).
13. **Persist safely.** Settings and high scores in localStorage under a versioned key
    (`game:v1:settings`), wrapped in try/catch; validate on load and fall back to defaults.
14. **Measure.** Chrome DevTools Performance panel with 4× CPU throttling: record 30 s of play and note
    long frames (>16.7 ms), scripting vs rendering time, and GC events. Run 5 minutes and confirm memory
    does not keep climbing. Log a rolling fps average in a debug overlay (toggle with backtick).
15. **Test.** Vitest: `update` with fixed STEP and seed produces the expected state (collisions,
    scoring, game over). Playwright smoke: page loads with no console errors, canvas is not blank, Enter
    starts the game, Escape pauses it, a hidden tab pauses it.

## Checklist
- [ ] Core loop sentence, win/lose, devices and inputs written down
- [ ] Fixed timestep with accumulator, interpolation, dt clamp and max steps
- [ ] State machine; no logic in event handlers
- [ ] Pauses on hidden tab, blur and Escape/P; no time jump on resume
- [ ] Pointer Events, touch-action none, remappable keys, on-screen touch controls
- [ ] Canvas DPR-correct (capped at 2), ResizeObserver, fixed virtual resolution
- [ ] No per-frame allocations in hot paths; pools for frequent objects
- [ ] Seeded PRNG; update is deterministic
- [ ] Audio starts only after a gesture; mute and volume saved
- [ ] Reduced motion honoured; ≤3 flashes per second; colour-blind safe; captions for sound cues
- [ ] Menus keyboard-operable with visible focus; score announced politely
- [ ] Versioned localStorage with try/catch and validation
- [ ] Profiled at 4× CPU throttle; p95 frame time recorded; memory stable for 5 minutes
- [ ] Unit tests for update logic and a Playwright smoke test pass

## Output template
```markdown
# Game loop report: <title>
Core loop: <one sentence> · Targets: <devices> · Inputs: <list>

## Architecture
- States: boot, menu, playing, paused, gameover
- STEP: 1/60 s · max dt: 0.25 s · max steps/frame: 5 · virtual resolution: <w×h>
- Renderer: Canvas 2D | WebGL (<library>) · Pools: <objects pooled>

## Performance (Chrome, 4× CPU throttle, 30 s play)
| Metric | Budget | Measured |
|---|---|---|
| Median frame time | ≤8 ms | |
| p95 frame time | ≤16.7 ms | |
| Long frames per minute | ≤5 | |
| Memory after 5 min | flat (±10%) | |

## Accessibility and comfort
- Reduced motion: <what changes> · Flash check: pass/fail · Pause: Esc/P/button
- Colour-blind safe: <how> · Audio cues captioned: yes/no

## Tests
- Unit: <command> → <result> · E2E smoke: <command> → <result>

## Known issues / next steps
- ...
```
