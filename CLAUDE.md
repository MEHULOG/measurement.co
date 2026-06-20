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

Convex codegen runs while `convex dev` is alive — if you add a new file in `convex/`, edit `schema.ts`, or the `api.*` types look stale, kick `convex dev` (or run `npx convex codegen`).

## High-level architecture

**Vite + React 18 + TypeScript** dashboard backed by **Convex** (realtime DB + serverless functions) with **Clerk** for auth. Subscription-gated: every signed-in user gets a 3-day free trial, after which they're routed to a billing page until they subscribe.

### Backend — `convex/`

Tables in `schema.ts`: `users`, `measurements`, `orders`, `apps`, `activities`, `counters`. Code is organized one file per table-or-feature: `users.ts`, `measurements.ts`, `orders.ts`, `apps.ts`, `activities.ts`, `billing.ts`, `reports.ts`.

- **Auth bridge** (`auth.config.ts`): Clerk is the JWT provider. `applicationID: 'convex'` **must** exactly match the JWT template name in the Clerk dashboard. Issuer URL comes from the Convex deployment env var `CLERK_JWT_ISSUER_DOMAIN` (set via `npx convex env set`, not `.env.local`).
- **First-user-becomes-admin**: `users.ts → store` mutation runs on every login. If the `users` table is empty, the new user gets `role: 'admin'`; otherwise `'employee'`. It also seeds `subscriptionStatus: 'trialing'` with `trialEndsAt = now + 3 days`.
- **Server is the source of truth for authorization**. Every authenticated function calls `requireUser(ctx)` or `requireAdmin(ctx)` from `users.ts`. Admins can read/edit/delete anything; employees only touch records they created (or were assigned). The frontend mirrors this with disabled controls but never gates security on the client.
- **Activity logging**: data-changing mutations call `logActivity(ctx, …)` from `activities.ts`. New mutations should keep this pattern — it powers the dashboard's recent-activity feed and the audit trail.
- **Sequential human IDs**: `MES-0001` (measurements) and `ORD-0001` (orders) come from the `counters` table via the `nextCode`/`nextOrderCode` helpers. To add another auto-ID series, follow that pattern — never client-side timestamps or UUIDs.
- **`billing.ts`** is the subscription truth: `computeAccess(user)` returns `{allowed, reason, msRemaining}` from `subscriptionStatus` + `trialEndsAt` + `currentPeriodEndsAt`. The `startCheckout` action runs Stripe if `STRIPE_SECRET_KEY` is set, otherwise activates a demo subscription so the flow is fully testable without Stripe. `dev_expireTrial` / `dev_resetTrial` are testing shortcuts so you don't have to wait 3 real days.

### Frontend — `src/`

- **Boot (`main.tsx`)** wraps the app in `ClerkProvider` → `ConvexProviderWithClerk` → `ThemeProvider` → `BrowserRouter` → `ErrorBoundary`. It also decodes the Clerk publishable key, detects placeholder values, and short-circuits to a `<ConfigError>` setup screen instead of crashing — re-use this pattern when adding new required env vars.
- **Routing (`App.tsx`)**: public `/`, `/auth`, `/terms`, `/privacy`. Protected: `/welcome` (gated by `<SignedIn>` + `<RedirectToSignIn>`) and `/app/*` (gated additionally by `<RequireActiveSubscription>` — see below).
- **Auth flow**: Sign-in/up at `/auth?mode=…` → first-time users land on `/welcome` (app-creation wizard) → main app at `/app/dashboard`. The unified `AuthPage` uses Clerk's `<SignIn>` / `<SignUp>` with `routing="virtual"` so tab switching doesn't change the URL path.
- **Subscription gate** (`RequireActiveSubscription.tsx`): wraps `DashboardLayout`. If `billing.status` returns `allowed: false` and the user isn't already on `/app/billing`, redirects to `/app/billing?reason=expired`. The billing page itself is exempt so users can resubscribe.
- **Convex queries must be gated on auth**. Every page using `useQuery(api.x.y)` should pass `'skip'` until `useConvexAuth().isAuthenticated` is true — otherwise queries fire before the Clerk JWT is verified and the console fills with `Not authenticated` errors. Pattern:
  ```ts
  const { isAuthenticated } = useConvexAuth()
  const data = useQuery(api.foo.bar, isAuthenticated ? args : 'skip')
  ```
- **UI primitives** in `src/components/ui/` (Button, Input, Card, Modal, Select, MultiSelect, Skeleton, ConfirmDialog, Badge, CenteredSpinner). Built on Radix + `class-variance-authority`, following shadcn conventions — extend by adding new files here rather than reaching for a UI library.
- **Theming** is class-based (`dark` on `<html>`) with HSL CSS variables in `src/index.css`. The `index.html` runs a pre-paint script that sets the class before React mounts (avoids flash). When adding colors, define CSS variables and extend `tailwind.config.js`.
- **Exports (`src/services/exports.ts`)** use `jsPDF` + `jspdf-autotable` (v5 named export) and `exceljs`. **Do not reintroduce `xlsx`** — it was removed for unpatched CVEs. ExcelJS's `writeBuffer()` returns a Promise, so call sites must await.
- **Camera measurement (`CameraMeasure.tsx`)** uses `getUserMedia` + a known-size reference object (credit card, A4, etc.) to compute mm-per-pixel from two tapped reference endpoints, then converts the object's pixel distance to real units. Only works on `localhost` or `https://` (secure context). Includes a diagnostics panel and a "Tap to start" fallback for autoplay-blocked browsers.

### Cross-cutting concerns

- **Trial / Pro status surfaces in three places** that must stay in sync: `<TrialBadge>` in the topbar (shows days remaining or Pro crown), `<ProBadge>` inline next to user names when active, and the Subscription card on `ProfilePage`. All three read from the same `useSubscription()` hook backed by `api.billing.status`.
- **Footer** (`src/components/Footer.tsx`) is mounted by both `DashboardLayout` and `LegalLayout`, links to `/terms` and `/privacy`. New legal pages should go through `LegalLayout` for consistent chrome.

## Conventions & gotchas

- **Path alias `@/`** maps to `src/` (configured in `tsconfig.app.json` and `vite.config.ts`). Use it for all imports inside `src/`.
- **Convex client imports** look like `from '../../convex/_generated/api'` (relative, not aliased) because `_generated` lives outside `src/`. Keep this — the alias would need to escape `src/` to reach it.
- **Type imports** from generated Convex code use `Doc<'tableName'>` / `Id<'tableName'>` from `convex/_generated/dataModel` — never redefine equivalent shapes.
- **`measurements.list` and `orders.list`** do role-aware querying server-side (admins see all, employees see only their own/assigned). Replicate this pattern for any new role-scoped list.
- **`npm overrides`** in `package.json` force patched versions of `ws` (≥ 8.21.0) and `uuid` (≥ 11.1.1) past Convex's and ExcelJS's vulnerable transitive deps. Don't remove these without re-running `npm audit`.
- **`@clerk/nextjs`** is listed in `package.json` but **never imported** — it's a stray dep, safe to remove when next touching dependencies.

## Environment configuration

Two sides need keeping in sync:

- **`.env.local`** (frontend, read by Vite): `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`, `CONVEX_DEPLOYMENT`.
- **Convex deployment env** (read by backend functions, set via `npx convex env set NAME value`):
  - `CLERK_JWT_ISSUER_DOMAIN` — required, must equal the Issuer URL of the Clerk JWT template named exactly `convex`.
  - `STRIPE_SECRET_KEY` — optional. If absent, `billing.startCheckout` runs in demo mode (instant activation, no real charge).

If you see "Not authenticated" errors after sign-in, the chain to check is: (a) does a `convex` JWT template exist in Clerk? (b) does its issuer match `CLERK_JWT_ISSUER_DOMAIN`? (c) has the user signed out + back in since the template was created? The `<AuthDebug>` widget mounted on `/welcome` walks all three checks.

When `convex dev` is interrupted while Convex env vars change, the local backend (`convex-local-backend.exe`) can cache stale values — kill the process tree and restart `npx convex dev` to force a JWKS refetch.
