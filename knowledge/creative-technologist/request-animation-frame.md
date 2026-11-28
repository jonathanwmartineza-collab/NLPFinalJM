# requestAnimationFrame: timing a game or animation loop

- Source: Window: requestAnimationFrame() method — https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame (accessed 2026-11-28)
- Publisher: Mozilla (MDN Web Docs)
- Licence: CC-BY-SA-2.5 (or any later version; code samples CC0), per MDN's attribution and licensing page · Copy in repo: link only

Why this matters for creative-technologist: the agent's fixed-timestep loop (`game-loop` skill) renders
with `requestAnimationFrame` and must look the same at 60, 90, 120 or 144 Hz and pause cleanly. These are
the exact rules for the callback, its timestamp and its scheduling.

## Key facts
- Syntax: `requestAnimationFrame(callback)`; the callback runs before the next repaint.
- Return value: an `unsigned long` request ID; pass it to `cancelAnimationFrame(id)` to cancel.
- One-shot: the callback must call `requestAnimationFrame()` again to get another frame.
- Callback argument `timestamp`: a `DOMHighResTimeStamp` in milliseconds (at least 1 ms precision), the
  end time of the previous frame's rendering. For windows it equals `document.timeline.currentTime`.
- All callbacks fired in the same frame get the same timestamp, even though time passes while earlier
  ones run. Same-origin windows and iframes share it, so their animations stay in sync.
- Rate: usually matches the display refresh rate; 60 Hz is most common, 75, 120 and 144 Hz are common
  too. Always compute progress from the timestamp, or the animation runs faster on high refresh-rate
  screens.
- Background tabs and hidden iframes: most browsers pause the callbacks to save power and battery.
- Request IDs are a per-window counter that can overflow (browsers differ); do not use `0` as a
  "no request" sentinel, use `null`.
- Starting an animation: set the zero point on the first callback when the animation must not jump
  (some browsers delay the first callback by several frames), or use `document.timeline.currentTime` to
  sync with other things. `performance.now()` gives little extra precision and no reliable sync.
- Syncing with an external clock is limited to one frame (16.67 ms at 60 Hz).
- Baseline "widely available" since July 2015. A worker version exists
  (`DedicatedWorkerGlobalScope.requestAnimationFrame()`).

## How to apply it here
- The loop in the agent file clamps `dt` to 0.25 s after a tab switch; that matches the pause behaviour
  above (a hidden tab gets no callbacks, so the first `dt` back is large).
- Use the callback's `timestamp`, not a separate `performance.now()`, for `dt`, so every rAF consumer in
  the frame agrees.
- Store the ID in `let rafId: number | null = null`; on pause, blur or unmount call
  `cancelAnimationFrame(rafId)` and set it to `null`.
- In React: start the loop in an Effect and cancel it in the Effect's cleanup (the loop syncs with an
  external system, the display).
- Listen for `visibilitychange` to show the pause menu; do not rely on rAF stopping to pause game logic.
- Never move things by a fixed step per frame; multiply by `dt` or step the fixed simulation from the
  accumulator.
- Several systems (particles, camera, UI tween) should share one rAF loop rather than each scheduling its
  own; they would get the same timestamp anyway, and one loop is easier to pause.
- Test on a 120 Hz device or with a forced refresh rate before claiming "smooth at 60 fps".

## Limits
- The page does not describe the worker method's behaviour or `OffscreenCanvas` rendering.
- It does not define a game-loop pattern; the fixed-timestep design is the agent's own (see its skill).
- Exact pause behaviour in background tabs is browser-specific ("most browsers").
