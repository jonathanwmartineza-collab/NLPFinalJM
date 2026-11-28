# Canvas 2D performance techniques

- Source: Optimizing canvas (Canvas API tutorial) — https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas (accessed 2026-11-28)
- Publisher: Mozilla (MDN Web Docs)
- Licence: CC-BY-SA-2.5 (or any later version; code samples CC0), per MDN's attribution and licensing page · Copy in repo: link only

Why this matters for creative-technologist: "Canvas 2D, no library" is the agent's first choice for simple
2D games, and the frame budget is 16.7 ms at 60 Hz. The "Browser game" prompt in `prompts/library.json`
leads to exactly this kind of build, which must stay smooth on a mid-range phone.

## Key facts
- Pre-render repeated drawing to an offscreen canvas (a second `<canvas>` made with
  `document.createElement("canvas")`) and copy it with `drawImage()` each frame.
- Use whole-number coordinates: fractional ones trigger sub-pixel anti-aliasing work; round with
  `Math.floor()` before `drawImage()`.
- Do not scale images inside `drawImage()` every frame; cache the needed sizes on offscreen canvases at
  load time.
- Layer the scene: separate stacked canvases for parts that change at different rates (for example UI on
  input only, gameplay every frame, background almost never), positioned absolutely with `z-index`.
- Put a large static background in a plain element with CSS `background` under the canvas instead of
  redrawing it.
- Scale the whole canvas with CSS transforms (GPU); best is no scaling, next best a small canvas scaled
  up rather than a big one scaled down. Fit with `Math.min(scaleX, scaleY)`, cover with `Math.max`.
- No transparency needed: `canvas.getContext("2d", { alpha: false })` lets the browser optimise.
- High-DPI: set `canvas.width/height` to CSS size × `devicePixelRatio`, call `ctx.scale(dpr, dpr)`, and set
  the CSS width and height back to the CSS size.
- More tips listed: batch calls (one polyline instead of many lines), avoid needless state changes,
  redraw only what changed, avoid `shadowBlur`, avoid text rendering, try `clearRect()` vs `fillRect()` vs
  resizing to clear, use `requestAnimationFrame()` not `setInterval()`, be careful with heavy physics
  libraries.

## How to apply it here
| Symptom | First fix to try |
|---|---|
| Frame time spikes when many sprites share a shape | pre-render the shape once, then `drawImage` |
| Blurry on phones | devicePixelRatio scaling as above |
| Slow on 3× DPR phones | cap the backing-store scale (for example `Math.min(dpr, 2)`) and measure |
| Static backdrop costs time | move it to CSS behind the canvas |
| Score text costs time | draw text on a separate UI layer only when the score changes |
| Glow effects drop frames | replace `shadowBlur` with a pre-rendered glow sprite |
- Start every game with `{ alpha: false }` unless the canvas sits over page content.
- Measure before and after in the Performance panel with 4× CPU throttling; keep own work ≤ 8 ms.
- Reduced motion: skip screen shake and particle bursts when
  `matchMedia('(prefers-reduced-motion: reduce)')` matches (the agent's own rule).
- Thousands of sprites or particles: switch to PixiJS (WebGL) per the agent's tech table, instead of
  pushing Canvas 2D further.

## Limits
- The article does not cover `OffscreenCanvas` in workers, WebGL or WebGPU.
- No numbers are given for how much each tip saves; measure on the target device.
- The DPR cap row in the table is a suggestion to test, not from the article (UNVERIFIED benefit).
