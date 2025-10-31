# API Overview

Base URL: `/api`

- `GET /health` — service status (root app)
- `POST /api/races` — create race; body: `{ seed?, closeInSeconds? }`
- `GET /api/races/:id` — get race info and bets count
- `POST /api/bets` — place bet; body: `{ raceId, horseId, amount, userId?, userType? }`
- `GET /api/odds?raceId=ID` — current odds snapshot for a race (uses virtual liquidity smoothing for opening odds)
- `POST /api/races/:id/settle` — settle race (runs simulation with race seed)
- `POST /api/races/:id/npc-bet` — place sample NPC bets based on odds
- `POST /api/races/simulate` — simulate race with `seed` for testing
- `GET /api/config` — client configuration

Notes
- Errors respond with `{ ok:false, error }` or `{ error }`.
- Odds use pari-mutuel with smoothing: `ratio = ((total+V)*(1-cut)) / (poolOnHorse+v)` where `v` is virtual liquidity per horse.
