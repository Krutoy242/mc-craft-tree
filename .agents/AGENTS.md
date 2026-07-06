# mc-craft-tree

pnpm monorepo — data pipeline: **mc-gatherer** (CLI) → structured data → **Craft Tree Visualizer** (Vue 3 SPA).

## Root — Craft Tree Visualizer

Vue 3 SPA (Vite + UnoCSS + Pinia + vue-router + d3).

- `src/pages/` routes · `src/components/` Vue components · `src/stores/` Pinia state
- `src/assets/data/` (populated by gatherer), `graph/` d3, `items/` models, `lib/` utilities

Build via Vite (`pnpm build` / `pnpm dev`).

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
