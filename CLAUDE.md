# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Vite + `convex dev` concurrently (preferred during development)
npm run dev:frontend   # Vite only
npm run dev:backend    # `convex dev` only — watches convex/ and pushes to the deployment
npm run build          # tsc -b && vite build
npm run preview        # serve the built bundle
npm run lint           # ESLint
npm run format         # Prettier across src/ and convex/
npx tsc -b             # type-check only (use this to verify changes — no test suite exists)
```

There is no test runner configured. "Verify" means `npx tsc -b` plus a manual click-through of the affected page.

Convex codegen runs automatically while `convex dev` is alive — if you edit `convex/schema.ts` or any function file and the `api.*` types look stale, kick `convex dev` (or run `npx convex codegen`).

## High-level architecture

This is a **Vite + React 18 + TypeScript** dashboard backed by **Convex** (realtime DB + serverless functions) with **Clerk** for auth. Two distinct layers:

### Backend — `convex/`

- `schema.ts` defines all tables. Notable tables: `users`, `measurements`, `activities`, `apps`, plus a `counters` table used to issue sequential `MES-####` codes.
- `auth.config.ts` declares Clerk as the JWT provider. The `applicationID` is `"convex"` — this **must** exactly match the name of the JWT template created in the Clerk dashboard. The issuer URL is read from the Convex deployment env var `CLERK_JWT_ISSUER_DOMAIN` (set via `npx convex env set …`, not `.env.local`).
- Every authenticated function calls `requireUser(ctx)` or `requireAdmin(ctx)` from `users.ts` — these resolve the Clerk identity to a `users` row (which is created on first login by the `store` mutation; the **first user becomes admin** automatically).
- Mutations that change data also call `logActivity(ctx, …)` from `activities.ts` to append an audit row. New mutations should keep this pattern.
- Authorization model: admins can read/edit/delete anything; employees can only touch records they created (or were assigned). The frontend mirrors this with disabled controls, but the server is the source of truth.

### Frontend — `src/`

- **Boot (`main.tsx`)** wraps the app in `ClerkProvider` → `ConvexProviderWithClerk` → `ThemeProvider` → `BrowserRouter` → `ErrorBoundary`. It also decodes the Clerk publishable key, detects placeholder values, and short-circuits to a `<ConfigError>` setup screen instead of crashing — useful pattern when adding new required env vars.
- **Routing (`App.tsx`)**: public `/`, `/auth`, then protected `/welcome` and `/app/*`. Both `/welcome` and `/app/*` are gated by `<SignedIn>` + `<RedirectToSignIn>`. The `/app/*` shell renders `<UserBootstrap>` (which calls `users.store` mutation once per session) and the dashboard layout.
- **Auth flow**: Sign-in/up at `/auth?mode=…` → first-time users hit `/welcome` (app-creation wizard) → main app at `/app/dashboard`. The unified `AuthPage` uses Clerk's `<SignIn>` / `<SignUp>` with `routing="virtual"` so tab switching doesn't change the URL path.
- **Convex queries must be gated on auth**. Every page using `useQuery(api.x.y)` should pass `'skip'` until `useConvexAuth().isAuthenticated` is true — otherwise queries fire before the Clerk JWT is verified and the console fills with `Not authenticated` errors. Pattern:
  ```ts
  const { isAuthenticated } = useConvexAuth()
  const data = useQuery(api.foo.bar, isAuthenticated ? args : 'skip')
  ```
- **UI primitives** live in `src/components/ui/` (Button, Input, Card, Modal, Select, MultiSelect, Skeleton, ConfirmDialog, Badge, CenteredSpinner). They're built on Radix + `class-variance-authority` and follow shadcn conventions — extend by adding new files here rather than reaching for a UI library.
- **Theming** is class-based (`dark` on `<html>`) with HSL CSS variables in `src/index.css`. The `index.html` runs a pre-paint script to set the class before React mounts (avoids flash). When adding colors, define them as CSS variables and extend `tailwind.config.js`.
- **Exports (`src/services/exports.ts`)** use `jsPDF` + `jspdf-autotable` (v5 named export) and `exceljs`. **Do not reintroduce `xlsx`** — it was removed because of unpatched CVEs. ExcelJS's API is async (`writeBuffer()` returns a Promise) so call sites must await.
- **Camera measurement (`CameraMeasure.tsx`)** uses `getUserMedia` + a known-size reference object (credit card etc.) to compute mm-per-pixel from two tapped reference endpoints, then converts the object's pixel distance to real units. Only works on `localhost` or `https://` (secure context). The component includes a built-in diagnostics panel and a "Tap to start" fallback for autoplay-blocked browsers.

## Conventions & gotchas

- **Path alias `@/`** maps to `src/` (configured in `tsconfig.app.json` and `vite.config.ts`). Always use it in imports inside `src/`.
- **Convex client imports** look like `from '../../convex/_generated/api'` (relative, not aliased) because `_generated` lives outside `src/`. Keep this — the alias would need to escape `src/` to reach it.
- **`apps.ts` function `myApps`** uses `withIndex('by_creator')` + `.order('desc')`. Convex applies the order to the index, not insertion time — keep index definitions and `.order()` aligned when adding new list queries.
- **`measurements.list`** does role-aware querying server-side (admins see all, employees see only their own + assigned). Replicate this pattern for any new role-scoped list.
- **Sequential IDs (`MES-0001`)** come from the `counters` table. To add a similar auto-ID for a new entity, follow the `nextCode` pattern in `measurements.ts` — never client-side timestamps.
- **`npm overrides`** in `package.json` force patched versions of `ws` (≥ 8.21.0) and `uuid` (≥ 11.1.1) past Convex's and ExcelJS's vulnerable transitive deps. Don't remove these without re-running `npm audit`.
- **`@clerk/nextjs`** is listed in `package.json` but **never imported** — it's a stray dep, safe to remove when next touching dependencies.

## Environment configuration

Two sides need keeping in sync:

- **`.env.local`** (frontend, read by Vite): `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`, `CONVEX_DEPLOYMENT`.
- **Convex deployment env** (read by backend functions, set via `npx convex env set NAME value`): `CLERK_JWT_ISSUER_DOMAIN` must equal the Issuer URL of the Clerk JWT template named exactly `convex`.

If you see "Not authenticated" errors after sign-in, the chain to check is: (a) does a `convex` JWT template exist in Clerk? (b) does its issuer match `CLERK_JWT_ISSUER_DOMAIN`? (c) has the user signed out + back in since the template was created? The `<AuthDebug>` widget mounted on `/welcome` walks all three checks.

When `convex dev` is interrupted while Convex env vars change, the local backend (`convex-local-backend.exe`) can cache stale values — kill the process tree and restart `npx convex dev` to force a JWKS refetch.
