# Craft reference for one-shot builds

**Layout.** Content max-width 1100–1240px; sections separated by space, not boxes. Use 12-column thinking but CSS grid with `repeat(auto-fit, minmax(min(100%, 260px), 1fr))` for cards. First screen = one balanced composition: headline, one sentence, one primary action, one picture.

**Type.** 4 sizes: display `clamp(32px, 5vw, 56px)`/1.05, h2 24–32px/1.15, body 16–17px/1.55, small 13–14px. Max 65–75 characters per line. `text-wrap: balance` on headings.

**Colour.** One dominant ground, one support, one accent used sparingly (CTAs, key data). Check contrast: white text needs an accent darker than about #767676-equivalent luminance; prefer accents like #C2410C, #1F64B0, #23784F. Dark theme is the same idea at night: dark ground #121212–#1c1917, ink #eee8e1, lighten the accent until it passes 4.5:1.

**Detail.** Consistent radius (8–12px), one shadow recipe, 1px hairlines in a soft line colour, icons as inline SVG with `currentColor`.

**Motion.** 150–250ms ease-out for UI feedback; never animate layout on load for more than 400ms; disable under reduced motion.

**Games.** Canvas with `requestAnimationFrame`, fixed-timestep update (e.g. 1/60s), keyboard + touch controls, pause on blur, start/restart screens, score in `localStorage`.
