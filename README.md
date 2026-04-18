# Jelly World

A cute 3D browser exploration platformer. You play a soft jelly creature climbing a single
vertical level — bounce, roll, and absorb smaller jellies to grow through size tiers until you
cross the finish line at the top.

**Play (once deployed):** `https://<your-github-user>.github.io/jelly-world/`

## Tech stack

- **Three.js** — WebGL 3D rendering
- **TypeScript** — strict mode, bundler-resolution
- **Vite** — dev server and production build
- **Web Audio API** — 100% procedural audio (no audio files anywhere)
- **GitHub Actions → GitHub Pages** — static deploy on every push to `main`

Physics engine and procedural-audio library are being finalized; see
`docs/IMPLEMENTATION_PLAN.md`.

## Design docs

- `jelly_world_browser_gdd.md` — full Game Design Document (source of truth for intent)
- `docs/IMPLEMENTATION_PLAN.md` — phased technical plan with exit criteria
- `docs/OPEN_QUESTIONS.md` — gaps, edge cases, and decisions still outstanding
- `docs/BUILD.md` — how the GitHub Pages deploy pipeline works

## Local development

Prerequisites: Node.js 20+ (see `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # produces dist/ — deployable static bundle
npm run preview      # serves the production build locally
npm run typecheck    # tsc --noEmit
```

## Project conventions

- **Procedural audio only.** Never commit `.wav`, `.mp3`, `.ogg`, or any audio file. All SFX and
  music is synthesized at runtime via Web Audio. This is a hard design constraint.
- **Browser-first performance.** Target mid-range laptop at 60 FPS. Budget draw calls, keep
  translucent surfaces selective, prefer stylized materials over real-time effects.
- **No SharedArrayBuffer features.** GitHub Pages cannot set the COOP/COEP headers that some
  WASM physics engines need in their threaded builds — use single-threaded builds only.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

TBD.
