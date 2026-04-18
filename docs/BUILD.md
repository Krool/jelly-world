# Build & Deploy

## One-time GitHub setup

1. Create the repository (`jelly-world`, public).
2. Push `main`.
3. Go to **Settings → Pages** and set **Source = GitHub Actions**.
4. The `Deploy to GitHub Pages` workflow (`.github/workflows/deploy.yml`) runs automatically on
   every push to `main`. First run will publish to
   `https://<your-user>.github.io/jelly-world/`.

That's it. No gh-pages branch, no manual publish step.

## How it works

The workflow has two jobs: `build` and `deploy`.

### `build`
1. Checks out the repo.
2. Installs Node (version from `.nvmrc`) with npm cache.
3. `npm install --no-audit --no-fund`. **TODO:** switch to `npm ci` once `package-lock.json`
   is committed (requires a local `npm install` run to generate it).
4. `npm run build` runs `tsc --noEmit && vite build` and produces `dist/`.
   - `BASE_PATH` is injected as `/<repo-name>/` so assets resolve correctly on project pages.
5. Uploads `dist/` as a Pages artifact.

### `deploy`
Takes the artifact and deploys it via the official `actions/deploy-pages@v4` action. Uses OIDC
(no Personal Access Token needed). The URL is surfaced as a job output on the Actions run.

## Why this shape, not `gh-pages` branch

The `actions/deploy-pages` path is the current recommended flow. It avoids a second branch,
deploys atomically, supports OIDC, and gives you an environment URL in the GitHub UI.

## Base path gotcha

GitHub project pages serve from `/<repo-name>/`, not `/`. `vite.config.ts` reads `BASE_PATH` at
build time and sets Vite's `base` accordingly. During `npm run dev` the base stays `/` so
hot-reload works normally.

If you rename the repo, either:
- rename the default in `vite.config.ts` to match, or
- rely on CI's `BASE_PATH: /${{ github.event.repository.name }}/` (already wired).

## Custom domain (later)

Add `CNAME` file with the domain + a `CNAME` step in the workflow that copies it into `dist/`
before upload, and configure DNS per GitHub's Pages docs. Not in MVP scope.

## Cache-Control

GitHub Pages sets `Cache-Control: max-age=600` (10 minutes) for all files and you cannot change
it. Vite emits hashed filenames for all build outputs, so users get the new bundle once their
browser's 10-minute cache expires. `index.html` is unhashed; that's fine — the 10-minute
freshness is acceptable for a hobby-project iteration loop.

## SharedArrayBuffer / threaded WASM

GitHub Pages cannot set the `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`
headers that cross-origin isolation requires. That means **no SharedArrayBuffer**, which rules
out threaded WASM builds of physics engines like Rapier or Ammo. Use the single-threaded builds
only. If we ever need threading we'll move off Pages to a host that can set headers (Netlify,
Cloudflare Pages, etc.).

## Local preview of the deployed build

```bash
BASE_PATH=/jelly-world/ npm run build
npm run preview
```

Then open `http://localhost:4173/jelly-world/`. This verifies asset paths work under the Pages
base before pushing.
