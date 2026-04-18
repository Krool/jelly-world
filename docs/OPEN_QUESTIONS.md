# Open Questions & Gap Analysis

Issues the GDD either lists as undecided or leaves implicit. Grouped by urgency. Items marked
**[BLOCKING M<n>]** must be answered before that milestone starts or they'll force rework.

---

## From the GDD (Section 21)

### OQ-01. Keyboard-only camera behaviour **[BLOCKING M2]**
The GDD says "if keyboard-only, camera should auto-follow and gently rotate to face movement
direction." Need to decide:
- Does the camera ever rotate *against* movement direction (e.g., player holds S to back up —
  does the camera orbit around to keep them facing the camera, or hold still)?
- Does the camera snap on hard direction reversals, or always interpolate?
- Vertical pitch: fixed, or does it rise as the player moves upward?

**Proposed default:** Always interpolate. Camera yaw tracks horizontal velocity direction with
a 0.5 s lag. If player is stationary for &gt; 1 s, camera holds position. Pitch rises slightly
(up to 10°) when player has net upward velocity for &gt; 0.5 s.

### OQ-02. Equal-size absorption at high speed?
GDD asks whether equal-size jelly can ever be absorbed with enough speed. This adds depth but
adds readability cost.

**Proposed default:** No, in MVP. Readability wins. Revisit if playtesters say the bump-back
feels punishing.

### OQ-03. Jump height vs tier
Does growing increase jump height, or only ground momentum?

**Proposed default:** Jump *impulse* stays constant, but because heavier tiers have slightly
higher gravity, *apex height* drops with size. Feels right for "heavier jelly." Counterbalance
by giving bounce-pads a velocity-matched boost so late-game platforms remain reachable.

### OQ-04. Does the hero have a face?
Strong silhouette wins every time; a face ups charm but adds one more thing to animate.

**Proposed default:** Yes, two dot eyes and a mouth, on a billboarded quad parented to the
mesh. Cheap, deforms visually with the squash because it's on a child transform. Revisit if
it ever looks creepy during extreme squash.

### OQ-05. Timer/score vs pure completion
The GDD leaves this open.

**Proposed default:** Show time-to-completion and max tier reached on the end screen. Don't
gate anything on them. Save a local-storage best time. No scoring during the run — no HUD
timer mid-session; it would stress the "relaxed" pillar.

### OQ-06. Engine **[RESOLVED]**
Three.js + TypeScript + Vite. See `IMPLEMENTATION_PLAN.md` rationale.

---

## Gaps I'm adding (not in GDD)

### OQ-07. Procedural-audio sound design sign-off **[BLOCKING M5]**
"Procedural" gives us infinite parameter space but zero reference tracks. Before M5 starts,
need a shared reference for what each SFX should *sound like*.

**Proposal:** During M5, produce a `docs/AUDIO_PALETTE.md` with ZzFX parameter arrays + embed
of a test HTML page that plays each sound. Iterate in the ZzFX designer
(zzfx.github.io) and paste the chosen array in. Commit the array, not audio.

### OQ-08. Rolling rumble dynamic range
Brown-noise rumble is hypnotic for 20 s and headache-inducing at 10 minutes. Need:
- Upper gain limit (don't exceed −18 dBFS peak).
- Mandatory fade-out if continuously active for &gt; 8 s even if player is still rolling
  (barely audible modulation).

### OQ-09. Audio suspension on tab hidden **[BLOCKING M5]**
Browsers throttle background tabs. Rolling rumble should stop on `visibilitychange → hidden`,
resume on return. Ambient pad should fade instead of cut.

### OQ-10. Fall threshold and respawn **[BLOCKING M4]**
Unclear from GDD:
- How far below a checkpoint triggers respawn? (Relative to checkpoint Y? Absolute world Y?)
- Does the player lose any absorbed mass on respawn?
- Is there a respawn animation, or instant teleport?

**Proposed default:** Absolute death-plane at level Y = −50. Instant respawn at last
checkpoint, no mass lost. Small puff VFX + a soft pop SFX to sell the teleport.

### OQ-11. Level data format
Hand-authored? In Three.js code? GLB imported from Blender? JSON of primitives?

**Proposed default:** For graybox (M4), author geometry inline as TS code with helper
factories (`box(x,y,z,w,h,d,color)`). Replace selectively with imported GLBs in M7 only for
shapes that can't be built from primitives. Keeps iteration fast and diffs readable.

### OQ-12. Collider vs visual scale coupling **[BLOCKING M3]**
When a tier-up happens, do collider + visual scale simultaneously, or visual leads by a frame
for a satisfying stretch?

**Proposed default:** Visual scale lerps over 250 ms with overshoot; collider scale snaps at
the midpoint. Prevents mid-animation collision weirdness.

### OQ-13. Jelly-creature AI budget
Each creature running wander AI + overlap checks every frame × N creatures is a potential
perf cliff.

**Proposed default:** Cap at 30 active AI creatures. Spatially partition into cells; only
creatures in cells adjacent to the player's cell think per-frame. Others think at 5 Hz. If
perf still suffers, convert small clusters to a single "cluster entity" that absorbs in one
pop.

### OQ-14. Colorblind readability
The GDD says "Color and size should make the rules readable at a glance" but color-based
danger signalling fails for the ~8% of players with CVD.

**Proposed default:** Encode absorb-safety in *size and outline thickness*, not hue. Too-big
jellies get a subtle dashed outline ring at the player's eye level; tiny ones a solid filled
silhouette from any angle. Colour is a bonus channel, not the primary.

### OQ-15. Reduced-motion accommodation
Some players get motion-sick from camera bob and heavy squash.

**Proposed default:** Respect `prefers-reduced-motion: reduce`. When on, halve camera bob
amplitude, halve squash amplitude, disable auto-rotate speed by 50%. Not a full settings
menu — just the OS-level media query. Document in README.

### OQ-16. Frame-rate-independent movement
Vite hot-reload + variable refresh rates means `dt` can spike. Need to either clamp `dt`
(safer, prevents tunnelling) or run physics on a fixed step with accumulator.

**Proposed default:** Fixed 60 Hz physics step with a max-4 substeps-per-frame accumulator.
Rendering interpolates between physics states for smoothness. Clamps tunnelling through thin
colliders.

### OQ-17. Mobile later — what design decisions to keep cheap now
Even if mobile is out of scope, we want to not paint ourselves into a corner.
- Virtual-joystick friendly: already true since movement is WASD-vector-based.
- Don't require Shift (roll). Plan a second input scheme: double-tap-to-roll, or a dedicated
  on-screen button. Design gameplay so roll is *nice to have*, not *required*, for any
  finish-line-reachable route.
- Keep bundle small (already a goal).

**Action:** Enforce the "no roll-required routes" rule during M4 level design.

### OQ-18. Analytics? **[BLOCKING M0 decision]**
Do we instrument playtest runs (completion time, tier reached, deaths)?

**Proposed default:** Not in v1. If added later, use a zero-cookie, zero-PII endpoint
(GitHub Pages can't host the receiver; would need a free tier on Cloudflare Workers or
similar). Revisit after first public playtest.

### OQ-19. Error / crash handling
WebGL context-loss, audio graph failure, unhandled promise rejections — what does the user
see?

**Proposed default:** Global `window.error` + `unhandledrejection` handler that swaps the
`<canvas>` for a friendly overlay ("Something jellified too hard. Refresh?"). Log to console
for debugging. No telemetry in MVP.

### OQ-20. Save storage schema & migration
Local storage is cheap to break. Need a versioned schema so a 0.2.0 build doesn't crash on
0.1.x data.

**Proposed default:** Single key `jellyworld:v1`. Value is JSON with `{ version: 1,
bestTimeMs, maxTier }`. On read, if `version` mismatches, ignore and overwrite. No migration
complexity in MVP.

### OQ-21. License
README currently says TBD.

**Proposed default:** MIT for code, CC-BY-4.0 for any authored art assets if we add any.
Needs a yes/no from you.

---

## Decision log

Record resolutions here as you lock them in. Format:
`YYYY-MM-DD — OQ-NN: <decision summary>`

- 2026-04-18 — OQ-06: Three.js + TS + Vite, custom kinematic controller, ZzFX + Web Audio.
