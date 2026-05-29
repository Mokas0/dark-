# DARKMON

> *You don't collect monsters to be the very best. You exploit them to be the very richest.*

A dark monster-exploitation MMO browser game. **React + Vite · Supabase · Netlify.**

This repo is the Phase 1–3 scaffold of the build spec: a fully playable local-first slice with the
data model, design system, and serverless functions wired in so plugging into Supabase + Netlify
brings the MMO layer online.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your Supabase keys (optional for local play)
npm run dev
```

Open `http://localhost:5173`. The game runs entirely in `localStorage` until Supabase env vars are present.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the build

## Stack

- **React 18 + Vite + React Router** — SPA shell
- **Tailwind** — design system with custom palette, glow utilities, CRT overlay
- **Zustand (persist)** — local-first game state
- **Framer Motion** — hatch/mutation reveals
- **D3** — lineage tree
- **Supabase** — auth, persistence, realtime (when configured)
- **Netlify Functions** — server-trusted fight/breed/harvest resolution

## What's in the box

### Pages
`/` landing · `/hub` operator dashboard · `/hub/kennel` · `/hub/breeding` ·
`/hub/inventory` · `/hub/syndicate` · `/market` · `/black-market` · `/bounties` ·
`/arena` · `/world` · `/profile/:id` · `/grimkin/:id`

### Core game logic (`src/lib/`)
- `grimkin.js` — species, rarity rolls, traits, breeding, mutation table, harvest yield, appraisal
- `combat.js` — arena tiers + stat-weighted fight resolution with scarring/death
- `rng.js` — seeded Mulberry32 so server can replay rolls

### Components (`src/components/`)
`Layout`, `GrimkinCard`, `GrimkinSprite` (procedural pixel sigil), `BreedingLab`-style flow,
`Countdown`, `HeatMeter`, `GoldDisplay`, `FactionBadge`, `MutationRoll`, `LineageTree`, `WorldEventBanner`.

### State (`src/state/useGameStore.js`)
Zustand store with persistence — all loops (catch, breed, harvest, list, auction, bounty, arena)
flow through actions that the same components can keep using once they're rewired to Supabase.

### Server (`netlify/functions/`)
- `resolve-fight.js` — server-trusted arena resolution
- `breed-offspring.js` — offspring generation
- `harvest-grimkin.js` — parts yield
- `process-bounty.js` — escrow release + evidence check
- `spawn-world-event.js` — scheduled-function-ready

### Schema (`supabase/migrations/0001_initial_schema.sql`)
All ten tables from the build spec, the `credit_player_gold` RPC, RLS policies (including the
black-market infamy gate), and the realtime publication setup.

## Wiring Supabase

1. Create a project at https://supabase.com.
2. Run `supabase/migrations/0001_initial_schema.sql` in the SQL editor.
3. Drop `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` into `.env.local`.
4. For Netlify Functions, also set `SUPABASE_SERVICE_ROLE_KEY` in Netlify env.
5. The client store still runs local-first — wire reads/writes to Supabase as you grow features.

## Wiring Netlify

```bash
netlify deploy --prod
```

`netlify.toml` already configures redirects (SPA) and the functions directory.

## Next steps from here

- Swap localStorage actions in `useGameStore` for Supabase queries
- Add Supabase Auth (magic link) on the landing page
- Subscribe components to realtime channels (`black_market_listings`, `arena_fights`, `bounties`)
- Wire the scheduled world-event function via Netlify scheduled functions
- Expand sprite system / add audio / mobile-responsive polish

---

*The Murk never sleeps.*
