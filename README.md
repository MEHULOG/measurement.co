# Measurement Management App

A production-ready measurement management dashboard built with **React + TypeScript + Tailwind**, **Clerk** for auth, and **Convex** for the realtime database and backend functions.

## Features

- **Auth (Clerk)** — email/password, Google social login, password reset, profile management
- **Roles** — admin / employee, enforced both server-side (Convex) and in the UI
- **Dashboard** — totals, today / this-month counters, 12-month trend chart, recent activity
- **Measurements CRUD** — auto-generated codes (`MES-0001`), search, customer & date filters, pagination, optimistic UI
- **Reports** — daily / weekly / monthly / custom range, line chart, **PDF** + **Excel** export
- **User management (admin only)** — change roles, remove users
- **Realtime** — every Convex query auto-subscribes, no manual refreshes
- **Activity log** — every create / update / delete is recorded with the actor
- **Dark / Light / System** theme with persistence, no flash on load
- **Fully responsive** — mobile sidebar, accessible Radix primitives, Sonner toasts

## Tech stack

| Layer       | Choice                                             |
| ----------- | -------------------------------------------------- |
| Frontend    | React 18, TypeScript, Vite                         |
| Styling     | Tailwind CSS, Radix UI, lucide-react               |
| Forms       | react-hook-form + Zod                              |
| Charts      | Recharts                                           |
| Backend     | Convex (queries, mutations, indexed tables)        |
| Auth        | Clerk (`@clerk/clerk-react` + `convex/react-clerk`)|
| Exports     | jsPDF + jspdf-autotable, xlsx, file-saver          |
| Routing     | React Router v6                                    |
| Notifs      | Sonner                                             |

## Project layout

```
.
├── convex/                # Backend: schema, queries, mutations
│   ├── schema.ts
│   ├── auth.config.ts
│   ├── users.ts
│   ├── measurements.ts
│   ├── activities.ts
│   └── reports.ts
└── src/
    ├── components/        # UI primitives + composed components
    │   └── ui/
    ├── hooks/
    ├── layouts/
    ├── lib/
    ├── pages/
    ├── services/          # PDF / Excel exporters
    └── types/
```

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure Clerk

1. Create an app at https://dashboard.clerk.com.
2. **Authentication → Social Connections** → enable **Google**.
3. **JWT Templates → New template → Convex** (the preset). Copy the **Issuer** URL.
4. **API Keys** → copy the **Publishable key**.

### 3. Configure Convex

```bash
npx convex dev
```

This will:
- create a deployment,
- set `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` in `.env.local`,
- push the schema + functions and watch for changes.

In the Convex dashboard set the environment variable:

```
CLERK_JWT_ISSUER_DOMAIN = <the Issuer URL from step 2.3>
```

### 4. Environment variables

Create `.env.local` (already partly populated by `convex dev`):

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_CONVEX_URL=https://xxx.convex.cloud
```

See `.env.example` for the full template.

### 5. Run

```bash
npm run dev
```

This starts Vite (frontend) and `convex dev` (backend) concurrently. Open http://localhost:5173.

> 💡 **First user becomes admin** automatically. After that, new sign-ups are `employee`s. An admin can promote anyone from **Users**.

## Useful scripts

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Vite + Convex in parallel                 |
| `npm run build`   | Type-check and build the frontend         |
| `npm run preview` | Preview the built frontend                |
| `npm run lint`    | ESLint                                    |
| `npm run format`  | Prettier                                  |

## Convex schema (summary)

| Table          | Notable fields                                                                              | Indexes                                              |
| -------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `users`        | `clerkId`, `email`, `name`, `imageUrl`, `role`                                              | `by_clerk_id`                                        |
| `measurements` | `code`, customer/phone/product, L/W/H, `unit`, `quantity`, `notes`, `createdBy`, timestamps | `by_code`, `by_creator`, `by_assignee`, `by_created` |
| `activities`   | `userId`, `action`, `entity`, `entityId`, `description`                                     | `by_user`, `by_created_at`                           |
| `counters`     | `name`, `value` (used to issue sequential `MES-####` codes)                                 | `by_name`                                            |

Relationships:
- `measurements.createdBy → users._id` (every measurement has a creator)
- `measurements.assignedTo → users._id` (optional)
- `activities.userId → users._id` (every CRUD operation is logged)

## Authorization model

- `requireUser(ctx)` — every mutation/query that needs a signed-in user.
- `requireAdmin(ctx)` — admin-only routes (user management).
- Measurement edit/delete: admins can touch anything; employees can only touch records they created.
- Frontend mirrors this with `<RequireAdmin>` route guards and disabled UI controls. **Server is the source of truth.**

## Deployment

### Frontend (Vercel / Netlify / Cloudflare Pages)

1. Set the same env vars in the hosting dashboard.
2. Build command: `npm run build`
3. Output: `dist`
4. SPA fallback to `index.html`.

### Backend (Convex)

```bash
npx convex deploy
```

Set `CLERK_JWT_ISSUER_DOMAIN` in the **production** environment in the Convex dashboard.

## Production checklist

- [ ] Real Clerk production keys + verified domain
- [ ] Convex `prod` deployment + env vars
- [ ] `npm run build` succeeds without TS errors
- [ ] Sign-in / sign-up / Google flows tested
- [ ] First-user-becomes-admin transition tested
- [ ] CRUD as both admin & employee tested
- [ ] PDF / Excel exports open in Office and Acrobat
- [ ] Dark / light themes verified

---

Built with ❤ — Convex + Clerk + React.
