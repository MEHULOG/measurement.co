# Polar — webhook & checkout configuration

Reference for setting up Polar in this project. Fill in the blanks as you go.

## 1. Where to enter the webhook in Polar

**Sandbox:** https://sandbox.polar.sh/dashboard
**Production:** https://polar.sh/dashboard

Org → **Settings → Webhooks → + Add Endpoint**

| Field           | Value                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| **URL**         | `https://<your-convex-deployment>.convex.site/polar/webhook`           |
| **Format**      | Standard Webhooks (default)                                            |
| **Events**      | See the table below — check exactly these 6                             |

> ⚠️ The `/polar/webhook` endpoint lives at `*.convex.site` (your Convex deployment's public site URL — **not** the API URL, and **not** `127.0.0.1`). Local anonymous deployments do **not** expose a publicly-reachable webhook host. For local testing use [ngrok](https://ngrok.com) → point Polar at `https://<your-ngrok>.ngrok.app/polar/webhook`. For real use, move to Convex Cloud.

After saving, Polar shows the **signing secret once** (`whsec_…`). Copy it immediately — you can't read it again.

## 2. Webhook events to subscribe

These are the only events the handler in `convex/http.ts` processes. Check exactly these six in the Polar webhook UI:

- [ ] `subscription.created`
- [ ] `subscription.updated`
- [ ] `subscription.active`
- [ ] `subscription.canceled`
- [ ] `subscription.revoked`
- [ ] `subscription.uncanceled`

| Event                     | What we do with it                                            |
| ------------------------- | ------------------------------------------------------------- |
| `subscription.created`    | Stamp `polarSubscriptionId` + `polarCustomerId` on the user.  |
| `subscription.active`     | Flip `subscriptionStatus → 'active'`, set `currentPeriodEndsAt`. **Unlocks camera + orders.** |
| `subscription.updated`    | Re-sync status / period from latest Polar state.              |
| `subscription.canceled`   | Set `subscriptionStatus → 'cancelled'`. Access continues until `currentPeriodEndsAt`. |
| `subscription.revoked`    | Set `subscriptionStatus → 'expired'`. Hard cutoff.            |
| `subscription.uncanceled` | Set `subscriptionStatus → 'active'` again.                    |

Any other event types are ignored (logged as `Polar webhook: ignoring event <type>`).

## 3. Convex env vars to set

Set these in your terminal (in this project directory). If `convex dev` is running and blocking port 3210, either stop it first or use the Convex dashboard env-var UI instead.

```bash
# Required for live mode (omit any of these → demo mode kicks in)
npx convex env set POLAR_ACCESS_TOKEN polar_oat_xxxxxxxxxxxx
npx convex env set POLAR_PRODUCT_ID_MONTHLY 00000000-0000-0000-0000-000000000000
npx convex env set POLAR_PRODUCT_ID_YEARLY  00000000-0000-0000-0000-000000000000

# Required for webhook signature verification (otherwise webhooks 503)
npx convex env set POLAR_WEBHOOK_SECRET whsec_xxxxxxxxxxxx

# Optional
npx convex env set POLAR_SERVER sandbox            # or omit for production
npx convex env set APP_PUBLIC_URL http://localhost:5173
```

Verify:

```bash
npx convex env list
```

| Variable                      | Where to find it                                                                                                | Required? |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- | --------- |
| `POLAR_ACCESS_TOKEN`          | Polar dashboard → **Settings → Developers → + New Token** (scope `checkouts:write`). Starts `polar_oat_`        | Yes for live mode |
| `POLAR_PRODUCT_ID_MONTHLY`    | Polar dashboard → **Products** → your Pro Monthly product → UUID on the product page / URL                      | Yes for live mode |
| `POLAR_PRODUCT_ID_YEARLY`     | Same as above, for Pro Yearly                                                                                   | Yes for live mode |
| `POLAR_WEBHOOK_SECRET`        | Shown **once** when you create the webhook in step 1. Starts `whsec_`                                           | Yes for live mode |
| `POLAR_SERVER`                | Literal `sandbox` (or omit / `production`)                                                                      | Optional  |
| `APP_PUBLIC_URL`              | Your origin — `http://localhost:5173` in dev, your real domain in prod. Used for `embed_origin` + `success_url` | Optional  |

If `POLAR_ACCESS_TOKEN` or either `POLAR_PRODUCT_ID_*` is missing, the app falls back to **demo mode**: the Subscribe button activates the user locally without opening checkout. Useful while you wire things up.

## 4. Products to create in Polar

Create two recurring products in the Polar dashboard (**Products → + New Product**):

| Product       | Recurring interval | Price | Use the UUID for env var       |
| ------------- | ------------------ | ----- | ------------------------------ |
| Pro Monthly   | Month              | $19   | `POLAR_PRODUCT_ID_MONTHLY`     |
| Pro Yearly    | Year               | $190  | `POLAR_PRODUCT_ID_YEARLY`      |

If you change the names or prices, also update the matching strings in:
- `convex/billing.ts` → `PLANS` constant
- `src/pages/BillingPage.tsx` → `PLAN_CARDS`
- `src/components/FeatureGate.tsx` → "Pro · $19/mo or $190/yr"
- `src/components/UpgradeBanner.tsx` → CTA copy
- `src/pages/ProfilePage.tsx` → "Pro Monthly — $19" buttons

## 5. End-to-end test plan

After setting all env vars and configuring the webhook:

1. Sign in to the app → you're on the 3-day trial
2. Open **Orders** or click the camera card on **Measurements** → upgrade overlay shows
3. Click **Go Pro — $19/mo** → Polar's iframe opens
4. Pay with [Polar's test card](https://docs.polar.sh) (sandbox only)
5. Polar fires `subscription.created` → `subscription.active` to your `/polar/webhook`
6. Your `subscriptionStatus` flips to `active`; banner disappears; gates unlock; Pro crown appears in topbar
7. Click **Cancel** on Billing → status flips to `cancelled`; you keep access until `currentPeriodEndsAt`

If step 6 doesn't happen, check:

- [ ] Did Polar actually deliver the webhook? Polar dashboard → **Webhooks → your endpoint → Deliveries** shows attempts + responses
- [ ] Did your endpoint respond `200`? Anything else means it'll retry (and you have a bug to fix)
- [ ] Convex logs: `npx convex logs` — look for "Polar webhook" entries
- [ ] `POLAR_WEBHOOK_SECRET` matches the one Polar showed you (no typo, no whitespace)
- [ ] Webhook URL points at `*.convex.site` (not `*.convex.cloud`) — `.cloud` is the function API, `.site` is HTTP routes

## 6. Notes on this implementation

- `convex/http.ts` verifies signatures per [Standard Webhooks spec](https://github.com/standard-webhooks/standard-webhooks) (HMAC-SHA256, base64, ±5min timestamp tolerance, constant-time compare).
- `external_customer_id` on the Polar Checkout Session is set to the **Convex `users._id`** — that's how `applyPolarEvent` matches incoming events back to a user.
- We don't store Polar API tokens or webhook secrets in `.env.local` — those live in the Convex deployment env so they're only accessible to backend functions.
- Polar's `subscription.trialing` status is mapped to our `active` (since they're paying customers in a trial); our 3-day app trial is tracked separately on `trialEndsAt`.

## 7. Switching between sandbox and production

1. Create the same products in the production org
2. Generate a production access token
3. Configure the production webhook (different URL if your Convex deployment differs between staging/prod)
4. Update env vars:
   ```bash
   npx convex env set POLAR_SERVER production
   npx convex env set POLAR_ACCESS_TOKEN <prod-token>
   npx convex env set POLAR_PRODUCT_ID_MONTHLY <prod-uuid>
   npx convex env set POLAR_PRODUCT_ID_YEARLY  <prod-uuid>
   npx convex env set POLAR_WEBHOOK_SECRET     <prod-whsec>
   ```

---

## Quick fill-in section

Paste your values here as you go. Then run the `npx convex env set` commands above.

```
POLAR_ACCESS_TOKEN          = __polar_oat_s2a4qfUSv4KfS4ZUcyNPULkt1o2Vh0JRjsl462QlLky__
POLAR_PRODUCT_ID_MONTHLY    = _d1806d4f-9471-4de9-9c0f-4e00c7e17190___
POLAR_PRODUCT_ID_YEARLY     = ____
POLAR_WEBHOOK_SECRET        = _polar_whs_D6FIHYDkmquml37X46BeyWJ8ZHQont2A4BK9j2ncmUc___
POLAR_SERVER                = ____   # sandbox | production
APP_PUBLIC_URL              = ____https://polar.sh/dashboard/measurement

Webhook URL configured in Polar:
  ____

Webhook events checked in Polar:
  [ ] subscription.created
  [ ] subscription.updated
  [ ] subscription.active
  [ ] subscription.canceled
  [ ] subscription.revoked
  [ ] subscription.uncanceled
```
