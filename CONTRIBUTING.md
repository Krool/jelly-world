# Contributing

## Branching

- `main` is the deploy branch. Every push triggers a GitHub Pages build + deploy.
- Work on feature branches (`feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`).
- Open a PR back to `main`. Keep PRs small — one milestone slice at a time.

## Commits

- Imperative subject line, under 72 chars. Example: `add bounce squash-and-stretch shader`.
- Body explains *why* when the reason isn't obvious from the diff.

## Code style

- TypeScript strict mode stays on. Fix types; do not `any` your way out.
- No audio files. Ever. Synthesize everything via Web Audio API.
- Prefer editing existing files. Avoid adding new abstractions before you have 3 real callers.
- Comments explain *why*, not *what*. Names should already explain the what.

## Before opening a PR

```bash
npm run typecheck
npm run build
```

Both must pass. The same checks run in CI.

## Design changes

Material design changes (new mechanics, scope additions, scope cuts) should be accompanied by
an update to `jelly_world_browser_gdd.md` or `docs/OPEN_QUESTIONS.md`. The GDD is a living
document until the MVP is shipped.
