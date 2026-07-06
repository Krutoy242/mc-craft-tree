# mc-craft-tree

pnpm monorepo — data pipeline: **mc-gatherer** (CLI) → structured data → **Craft Tree Visualizer** (Vue 3 SPA).

## Root — Craft Tree Visualizer

Vue 3 SPA (Vite + UnoCSS + Pinia + vue-router + d3).

- `src/pages/` routes · `src/components/` Vue components · `src/stores/` Pinia state
- `src/assets/data/` (populated by gatherer), `graph/` d3, `items/` models, `lib/` utilities

Build via Vite (`pnpm build` / `pnpm dev`).

### Debugging in a browser (for agents)

The `dev` script runs Vite with `--open` on a fixed port (currently **3333**): it opens a browser and stays in the foreground. Therefore:

- A dev server may already be serving at `http://localhost:3333` — **reuse it**, don't start a second one.
- If you must start one yourself, run it **detached / backgrounded** and never block on it (a foreground `pnpm dev` will hang you). **Do not kill servers you didn't start.**
- Inspect via the Playwright MCP: `browser_navigate` to the URL, then `browser_console_messages` / `browser_take_screenshot`.
- The **Graph** tab can take ~a minute to render — wait before capturing.

## mc-gatherer/ — CLI data collector (git submodule)

TypeScript CLI (tsx) scraping a modpack install and exporting structured data.

- `src/from/` importers (JEIExporter, JEC, JER, TellMe, CraftTweaker)
- `src/api/` core model · `src/lib/` business logic · `src/types/` shared types
- `src/custom/` hardcoded recipes per mod/pack · `src/tools/` helpers & export

Entry: `src/index.ts` (pipeline), `src/cli.ts` (citty, `--yes`, auto non-TTY/CI).

Run: `pnpm run:e2ee` / `pnpm run:herodotus`. Output: `items.csv` · `recipes.json` · `oredict.json`.

## Data flow

```
Modpack exports + custom recipes → mc-gatherer
→ items.csv · recipes.json · oredict.json
→ src/assets/data/{e2ee,herodotus}/ → Visualizer
```
