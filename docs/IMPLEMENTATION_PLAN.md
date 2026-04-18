# Jelly World — Implementation Plan

Phased, milestone-based. Each milestone has an exit criterion you can demo in the browser.
Don't move on until the criterion is met. When something from a later milestone would
accidentally block an earlier one, call it out in the PR, don't silently expand scope.

The order prioritises **game feel first, content second** — per GDD Section 18 Risk 1 and the
Recommended Next Step. Movement and growth must feel fun before we build a level around them.

---

## Stack (locked)

- **Rendering:** Three.js r163+, WebGLRenderer (WebGPU as optional later upgrade for hero
  transmission shader).
- **Language/build:** TypeScript strict, Vite 5, Node 20.
- **Physics:** Custom kinematic controller + `three-mesh-bvh` for sphere-vs-world closest-point
  queries. No Rapier/Cannon. Rationale: GDD calls for arcade-feel, animation-driven bounce; a
  full solver fights you and adds 500 KB–1 MB of WASM for negative value.
- **Audio:** ZzFX for one-shot SFX (pre-rendered to AudioBuffers on load). Hand-rolled Web
  Audio graph for the rolling rumble (continuous brown-noise + lowpass + velocity modulation)
  and ambient pad (detuned triangle oscs + slow LFO + seeded stochastic melody). No Tone.js.
- **Deployment:** GitHub Actions → Pages via `actions/deploy-pages@v4`.

## Non-negotiable constraints

1. **No audio files.** All sound synthesized at runtime. No `.wav`/`.mp3`/`.ogg` in the repo.
2. **No SharedArrayBuffer.** GitHub Pages can't set COOP/COEP headers. Means single-threaded
   WASM only, no `OffscreenCanvas` transfers that require it, no threaded physics.
3. **Autoplay gesture gate.** Audio requires user interaction to start. Intro screen doubles as
   the gate; show it on every cold load until the player clicks through.
4. **Bundle budget.** &lt; 600 KB gz initial JS. Three.js is already ~150 KB gz tree-shaken;
   app + ZzFX + BVH should fit.

---

## M0 — Scaffold & Deploy Pipeline

**Goal:** A spinning jelly cube is live at `<user>.github.io/jelly-world/` on every push to main.

- [x] Vite + TS + Three.js scaffold
- [x] `vite.config.ts` with dynamic `base` path for Pages
- [x] GitHub Actions workflow (`actions/deploy-pages@v4`)
- [x] README, CONTRIBUTING, BUILD docs
- [ ] Repo created, `main` pushed, Pages enabled via Actions source
- [ ] First green deploy visible at the Pages URL

**Exit:** Visit the live URL, see the pink icosahedron with squish animation and dark-violet
ground disc. Takes under 2 s to paint on a warm cache.

---

## M1 — Movement Prototype (bounce mode only)

**Goal:** Player can move around a flat graybox and it feels bouncy.

- Player entity = sphere collider + child visual mesh (icosahedron with vertex-shader squash).
- Keyboard input (WASD / arrows), deadzoned, mapped to a move direction in world space.
- Custom kinematic controller:
  - Gravity, input acceleration clamped to max speed.
  - Sphere-cast against flat ground via `three-mesh-bvh`.
  - Ground contact resolves penetration along contact normal.
  - On ground, inject a small upward impulse each landing — the GDD's "automatic vertical bob."
- Vertex-shader squash uniforms: `uSquashAxis`, `uSquash`, `uTime`. On landing, punch `uSquash
  ← |v_down| / vMax` then ease to 0 over 200 ms with back-out easing.
- Basic third-person follow camera (smoothed lerp, no auto-rotate yet).
- Flat graybox test arena (20 × 20 plane, a few static boxes for collision).

**Exit criterion:** Play it for 60 s with no input other than WASD and it feels *fun*. If it
doesn't, fix feel here — do not proceed.

---

## M2 — Roll Mode, Jump, Camera Auto-Follow

**Goal:** Complete movement palette is in, camera doesn't demand mouse.

- Hold Shift → enter roll mode. Higher max speed, lower turn rate, reduced bounce amplitude,
  different `uSquashAxis` (forward-leaning).
- Space → single light hop. Coyote time 100 ms, jump buffer 100 ms.
- Camera gently rotates toward travel direction over ~0.5 s when player moves.
- Camera lifts slightly on sustained upward motion.
- Ramp / slope graybox added to arena. Rolling downhill accelerates; rolling uphill drains
  speed.

**Exit:** Keyboard-only play feels complete. Player never needs to touch the mouse.

---

## M3 — Absorption & Growth

**Goal:** Core reward loop is in. Absorbing jellies grows the player through tiers.

- Jelly creature entity with simple wander AI (waypoint + idle bob).
- Size comparison on overlap:
  - Smaller → absorbed (remove from scene, increment tier counter, punch squash, play ZzFX
    slurp).
  - Equal / larger → bump player back (velocity reflection, smaller squash, play ZzFX bonk).
- Growth tiers per GDD Section 5.4: Tiny → Small → Medium → Large → Big Jelly. Tier thresholds
  placeholder (5 / 8 / 12 / 16). Scale collider + visual mesh on tier-up. Slight heavier feel
  (gravity ×1.1 per tier, max speed ×1.05, turn rate ×0.95).
- Visible size-gain pulse on tier-up (1-frame flash + 150 ms squash impulse).
- Simple tier indicator in corner.

**Exit:** A playtester with no onboarding figures out "eat smaller jellies, grow" in under
30 seconds. Tier-up feels satisfying.

---

## M4 — Vertical Level Graybox

**Goal:** One complete bottom-to-top level exists as graybox geometry, climbable.

- Four zones per GDD Section 6: Bottom (onboarding), Mid (ramps + first growth gate), Upper
  (rolling momentum sections), Summit (finish approach).
- Two to four checkpoints. Touching one sets respawn point. Falling below a death plane
  respawns at the last checkpoint.
- Soft blockers (jelly curtains) that require tier ≥ 3 to push through.
- Finish line volume at the top. Overlapping it triggers end state.
- Jelly creatures sprinkled: ~8 Tiny, ~4 Fast, 1–2 Cluster groups, a couple Decorative Giants
  for scale reference.

**Exit:** A first-time player can reach the finish in 5–12 minutes with minimal frustration.

---

## M5 — Procedural Audio

**Goal:** Every sound in the game is synthesized. Machine-quiet to music in one click.

- Audio system bootstrapped from the intro-screen click (gesture-gated). Resume on every input
  in case Safari re-suspends.
- On load, pre-render all one-shot SFX via OfflineAudioContext → AudioBuffers:
  - Squish (bounce landing, 3 pitch variants)
  - Boing (jump, 2 variants)
  - Slurp/pop (absorb, 3 variants)
  - Soft bonk (same-size bump, 2 variants)
  - Checkpoint chime (major-6 chord, bell envelope)
  - Finish swell (slow-attack stacked chord + FM bell)
  - UI confirm / start (subtle click)
- Continuous voices (live Web Audio graph):
  - **Rolling rumble:** brown noise → lowpass(200 Hz, resonance 2) → gain, amplitude + cutoff
    modulated by roll velocity. Fade in/out 150 ms on state transitions.
  - **Ambient pad:** 3 detuned triangle oscs per voice, 2–3 voices active at a time,
    cross-faded. Slow LFO on lowpass cutoff. Seeded stochastic melody picks next note from
    weighted neighbor table every 4–8 s. Pentatonic base, add a lydian 4th for summit zone.
- Zone-reactive mix: ambient pad brightens subtly in upper zones (lowpass cutoff rises).
- Master compressor on the output bus.

**Exit:** A playthrough with audio on feels cohesive for the full session and never annoying.
Audio stays under 10 live voices at any time. No clicks/pops on start.

---

## M6 — UI, Onboarding, End Screen

**Goal:** Minimal UI that teaches the game without text walls.

- Intro screen with Start button (also serves as audio-gesture gate). One sentence of control
  hint.
- In-world floating prompts in the Bottom Zone — one per: move, hold-to-roll, absorb smaller
  jellies, reach the top. Each prompt fades when the player performs the action successfully.
- HUD: current tier icon + progress ring toward next tier. That's it.
- End screen: "You made it!" + time taken + final tier + Restart.
- Escape → pause overlay with Resume / Restart (no sound slider in MVP; muting is intro-screen
  only — noted in open questions).

**Exit:** Someone who never read the GDD gets through the whole game with no external help.

---

## M7 — Visual Polish & Performance Pass

**Goal:** It looks charming and runs at 60 FPS on a mid-range laptop.

- Hero jelly material upgrade: `MeshPhysicalMaterial` with transmission on the player only
  (fake fresnel-based pseudo-translucency for other jellies, since real transmission re-renders
  the scene).
- Bounce puff particles (GPU points, no physics) on landings.
- Ripple decals on soft surfaces where the jelly touches.
- Color zones per height band (Bottom = pink/cream, Mid = mint/peach, Upper = lavender, Summit
  = sunset gradient).
- Performance budget verification: capture a 60 s session trace in Chrome DevTools. Frame time
  under 16.6 ms at target hardware. Heap stable (no per-frame allocations). Draw calls under
  100.

**Exit:** It looks like the screenshot you'd put in a tweet.

---

## Nice-to-haves (post-MVP, only if the core is already fun)

- Time trial mode + local-storage best time.
- Additional jelly creature types (sticky jelly that slows, gust jelly that puffs you upward).
- Cosmetic jelly skins.
- Mouse camera rotate (Q/E) and full mouse-look option.
- Reduced-motion setting that dampens camera bob and wobble amplitude.
- Remappable controls.
- Mobile touch controls (significant additional work — see Open Questions).

---

## What's explicitly NOT in scope

From GDD Section 17 plus additions:

- Multiplayer / leaderboards requiring a backend.
- Combat or damage system.
- Narrative or dialogue.
- Multiple levels / open world.
- Save slots beyond a single "best time" in local storage.
- Mobile support (controls, layout, performance) in v1.
- Internationalisation (English-only MVP).
- Accessibility beyond "no mouse required" and an intro-screen start click (revisit in v2).

---

## Risk register (short form — full text in GDD §18)

| Risk | Mitigation baked into this plan |
|---|---|
| Movement feels mushy | M1 exit criterion gates progression on "feels fun" before any content. |
| Growth doesn't matter | M3 ties tier to soft gates in M4; no tier = no access to upper zones. |
| Camera struggles in vertical space | Auto-follow in M2 + open level design in M4 + collision check with `three-mesh-bvh`. |
| Perf from translucency | M7 restricts real transmission to hero only; everything else is fake. |
| Replayability | Time + tier on end screen (M6), alternate routes in M4; beyond that is nice-to-have. |
| Procedural audio sounds bad | M5 uses ZzFX's tunable parameter set with in-browser designer for iteration; not "synthesize from first principles." |

---

## Open questions

See `docs/OPEN_QUESTIONS.md`. Resolve before they block the milestone that depends on them.
