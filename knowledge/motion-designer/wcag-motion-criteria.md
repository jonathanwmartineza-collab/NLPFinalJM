# WCAG motion rules: animation from interactions and pause, stop, hide

- Source: Understanding SC 2.3.3 Animation from Interactions — https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html (accessed 2026-11-28)
- Supporting: Understanding SC 2.2.2 Pause, Stop, Hide — https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html (accessed 2026-11-28)
- Publisher: W3C Web Accessibility Initiative (WAI)
- Licence: W3C Document License 2023 (no SPDX id; publisher's terms) · Copy in repo: link only

Why this matters for motion-designer: hover lifts and panel entrances are interaction-triggered
motion (2.3.3); spinners, pulsing dots and anything that loops while other content is visible are
automatic motion (2.2.2). They follow different rules.

## Key facts: 2.3.3 Animation from Interactions (Level AAA)
- Motion animation triggered by interaction can be disabled, unless the animation is essential.
- Motion animation = adding steps between states to create the illusion of movement or a smooth
  transition. Something that simply appears is not animated.
- Colour changes and opacity changes are not motion animation (an erratum removed blurring from
  that exclusion list).
- Essential = removing it would fundamentally change the information or function, and it cannot
  be done another conforming way.
- Intent: non-essential movement can cause vestibular reactions such as dizziness, nausea and
  headaches; parallax scrolling is often non-essential.
- Scrolling that brings content into view is allowed; extra scroll effects should be optional.
- Sufficient techniques: C39 (CSS `prefers-reduced-motion`), SCR40 (the same query in JavaScript),
  or a site setting that prevents animation.
- Examples: a page-flip effect that turns off when reduced motion is set; a site-wide switch for
  decorative parallax.

## Key facts: 2.2.2 Pause, Stop, Hide (Level A)
- Moving, blinking or scrolling content that starts automatically, lasts more than 5 seconds and
  is shown in parallel with other content needs a way to pause, stop or hide it.
- Auto-updating content that starts automatically and is shown with other content needs a way to
  pause, stop, hide or control frequency; there is no 5-second allowance for auto-updating.
- "Starts automatically" includes indirect triggers such as hover or scrolling into view.
- Exception: the movement is essential to the activity.
- A preloader that is the only content on the page needs no pause control; a loading animation can
  be essential when interaction is impossible during that phase and hiding progress would confuse.
- 2.2.2 applies to all content on a page, including parts not relied on (non-interference).
- Techniques: G4 (pause and resume), G11 (blinks under 5 s), G152 (animated GIF stops within 5 s),
  G186 (a control that stops motion), G191 (reload without blinking), SCR22, SCR33.
- Failures: F16 (non-essential scrolling with no pause), F50 and F112 (blinking over 5 s with no
  stop), F7 (an object or applet running over 5 s).

## How to apply it here
| Motion on the site | Criterion | Rule we follow |
|---|---|---|
| Hover/press transforms, panel slides | 2.3.3 (AAA) | Off under `prefers-reduced-motion: reduce` |
| Colour and opacity fades | Not motion animation | May stay in reduced mode |
| `.nlp-spin` while Pyodide loads (page still usable) | 2.2.2 if over 5 s | Stops in reduced mode; status text visible; ends when loading ends |
| `.dots` "thinking" pulse beside the chat | 2.2.2 if over 5 s | Same; never loops after the reply arrives |
| WebLLM model download progress | Progress, essential | Determinate bar or text percentage; no decorative loop |
| Any auto-rotating or ticker content | 2.2.2 | Do not add one; if needed, give a Pause button |
- Long waits (model download can exceed 5 s): prefer a determinate, text-labelled progress bar over
  an infinite loop, and stop all looping once the state changes.
- Keep durations as shared tokens so reduced mode can set them to zero in one place.

## Limits
- 2.3.3 is Level AAA; the studio target is AA, but the agent's rules already require reduced-motion
  variants, so we meet it anyway.
- Flashing limits (2.3.1, three flashes per second) are a separate criterion not read for this note.
- The pages do not set durations or easing; those are studio choices.
