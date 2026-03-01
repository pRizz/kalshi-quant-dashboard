# Kalshi Quant Dashboard (Local-only)

Local full-stack trading dashboard and quant analytics playground for Kalshi.

## Stack

- TypeScript (everywhere)
- Bun workspace tooling
- SolidStart (full-stack app)
- SQLite + Drizzle ORM
- shadcn-solid style UI components (dark mode default)

## Workspace layout

- `apps/web`: SolidStart app
- `packages/kalshi-client`: typed Kalshi API client (public + private)
- `packages/analytics-core`: Monte Carlo + calibration/Brier analytics modules
- `packages/shared-types`: shared app domain types

## Local setup

```bash
bun install
bun run dev
```

Open the app at the local SolidStart URL.

## Defaults and guardrails

- App launches in **Production + Read-Only** mode.
- No secrets are required for read-only launch.
- Private Kalshi calls are blocked until onboarding completes:
  1. user opts into local secret reading,
  2. user provides environment + credential references,
  3. credentials validate successfully.

## Testing

```bash
bun run test
bun run test:e2e
```

## Notes

- Kalshi is source-of-truth for orders/fills/positions.
- Local DB augments mirrored data with annotations, saved views, and analytics runs.
- Advanced analytics from the referenced gist are intentionally deferred in v1. See `docs/future-work.md`.