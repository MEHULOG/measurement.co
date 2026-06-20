import { v } from 'convex/values'
import {
  mutation,
  query,
  action,
  internalMutation,
} from './_generated/server'
import { Doc } from './_generated/dataModel'
import { api, internal } from './_generated/api'
import { requireUser } from './users'
import { logActivity } from './activities'

export const PLANS = {
  pro_monthly: {
    id: 'pro_monthly' as const,
    name: 'Pro Monthly',
    priceCents: 1900,
    interval: 'month' as const,
    description: 'Everything in Free, billed monthly.',
  },
  pro_yearly: {
    id: 'pro_yearly' as const,
    name: 'Pro Yearly',
    priceCents: 19000,
    interval: 'year' as const,
    description: 'Two months free. Best for committed teams.',
  },
} as const

export type PlanId = keyof typeof PLANS

/**
 * Compute whether the current user has access to gated features.
 * Used by the route guard, topbar trial badge, and feature overlays.
 */
export function computeAccess(user: Doc<'users'>) {
  const now = Date.now()
  const status = user.subscriptionStatus ?? 'trialing'
  const trialEndsAt = user.trialEndsAt ?? 0
  const currentPeriodEndsAt = user.currentPeriodEndsAt ?? 0

  if (status === 'active' && currentPeriodEndsAt > now) {
    return {
      allowed: true,
      reason: 'active' as const,
      msRemaining: currentPeriodEndsAt - now,
    }
  }
  if (status === 'trialing' && trialEndsAt > now) {
    return {
      allowed: true,
      reason: 'trialing' as const,
      msRemaining: trialEndsAt - now,
    }
  }
  return {
    allowed: false,
    reason:
      status === 'cancelled'
        ? ('cancelled' as const)
        : status === 'past_due'
          ? ('past_due' as const)
          : ('expired' as const),
    msRemaining: 0,
  }
}

export const status = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const access = computeAccess(user)
    return {
      ...access,
      status: user.subscriptionStatus ?? 'trialing',
      plan: user.plan ?? null,
      trialEndsAt: user.trialEndsAt ?? null,
      currentPeriodEndsAt: user.currentPeriodEndsAt ?? null,
      hasPolarCustomer: !!user.polarCustomerId,
    }
  },
})

// ──────────────────────────────────────────────────────────────────────
// Polar Embedded Checkout
// ──────────────────────────────────────────────────────────────────────

const POLAR_API_BASE = () =>
  process.env.POLAR_SERVER === 'sandbox'
    ? 'https://sandbox-api.polar.sh'
    : 'https://api.polar.sh'

/**
 * Creates a Polar Checkout Session and returns the embeddable URL.
 *
 * Requires these Convex env vars:
 *   POLAR_ACCESS_TOKEN          — Polar org-scoped API token (Bearer)
 *   POLAR_PRODUCT_ID_MONTHLY    — Polar product UUID for Pro Monthly
 *   POLAR_PRODUCT_ID_YEARLY     — Polar product UUID for Pro Yearly
 *   POLAR_SERVER                — "sandbox" or "production" (defaults to production)
 *
 * Optional:
 *   APP_PUBLIC_URL              — your deployed origin. Used for `embed_origin` and
 *                                 `success_url`. Defaults to http://localhost:5173.
 *
 * If POLAR_ACCESS_TOKEN is absent we fall back to demo activation so the flow
 * is testable without a Polar account.
 */
export const startCheckout = action({
  args: { plan: v.union(v.literal('pro_monthly'), v.literal('pro_yearly')) },
  handler: async (
    ctx,
    { plan },
  ): Promise<
    | { mode: 'polar'; url: string; checkoutId: string }
    | { mode: 'demo'; url: string }
  > => {
    const user = await ctx.runQuery(api.users.me)
    if (!user) throw new Error('Not authenticated')

    const token = process.env.POLAR_ACCESS_TOKEN
    const productId =
      plan === 'pro_monthly'
        ? process.env.POLAR_PRODUCT_ID_MONTHLY
        : process.env.POLAR_PRODUCT_ID_YEARLY

    // Fallback: demo mode (no Polar credentials configured).
    if (!token || !productId) {
      await ctx.runMutation(api.billing.activateDemoPlan, { plan })
      return { mode: 'demo', url: '/app/billing?demo=success' }
    }

    const appUrl = process.env.APP_PUBLIC_URL ?? 'http://localhost:5173'
    const response = await fetch(`${POLAR_API_BASE()}/v1/checkouts/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: [productId],
        external_customer_id: user._id,
        customer_email: user.email,
        customer_name: user.name,
        customer_metadata: {
          clerk_id: user.clerkId,
          plan_tier: plan,
        },
        metadata: {
          convex_user_id: user._id,
          plan,
        },
        embed_origin: appUrl,
        success_url: `${appUrl}/app/billing?checkout_id={CHECKOUT_ID}`,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('Polar checkout error', response.status, body)
      let detail = body
      try {
        const parsed = JSON.parse(body) as { detail?: unknown }
        if (parsed.detail) detail = JSON.stringify(parsed.detail)
      } catch {}
      throw new Error(`Polar checkout failed (${response.status}): ${detail}`)
    }

    const session = (await response.json()) as { id: string; url: string }
    return { mode: 'polar', url: session.url, checkoutId: session.id }
  },
})

// ──────────────────────────────────────────────────────────────────────
// Webhook → internal mutation
// ──────────────────────────────────────────────────────────────────────

const POLAR_STATUS_MAP: Record<
  string,
  'active' | 'past_due' | 'cancelled' | 'expired'
> = {
  active: 'active',
  trialing: 'active', // trial via Polar still counts as access; we track our own 3-day trial separately
  past_due: 'past_due',
  unpaid: 'past_due',
  canceled: 'cancelled',
  incomplete_expired: 'expired',
  incomplete: 'expired',
}

/**
 * Called by the HTTP webhook handler (in `convex/http.ts`) after the
 * Polar signature is verified. Updates the matching user's billing state.
 */
export const applyPolarEvent = internalMutation({
  args: {
    type: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, { type, payload }) => {
    // Polar subscription event payloads have these fields:
    //   id, status, customer (object), product, metadata, current_period_end, etc.
    const data = (payload?.data ?? payload) as {
      id?: string
      status?: string
      customer?: { id?: string; external_id?: string | null }
      external_customer_id?: string
      metadata?: Record<string, unknown>
      current_period_end?: string | null
      ended_at?: string | null
      product_id?: string
    }

    const externalId =
      data.external_customer_id ?? data.customer?.external_id ?? null
    if (!externalId) {
      console.warn('Polar webhook missing external_customer_id', type, data.id)
      return
    }

    // external_customer_id was set to the Convex user _id at checkout time
    let user = await ctx.db.normalizeId('users', externalId)
      ? await ctx.db.get(ctx.db.normalizeId('users', externalId)!)
      : null
    if (!user && data.customer?.id) {
      user = await ctx.db
        .query('users')
        .withIndex('by_polar_customer', (q) =>
          q.eq('polarCustomerId', data.customer!.id!),
        )
        .unique()
    }
    if (!user) {
      console.warn('Polar webhook for unknown user', externalId)
      return
    }

    const newStatus =
      data.status && POLAR_STATUS_MAP[data.status]
        ? POLAR_STATUS_MAP[data.status]
        : undefined

    const periodEnd = data.current_period_end
      ? new Date(data.current_period_end).getTime()
      : undefined

    // Map back to our plan ids from metadata if possible
    const planFromMeta = (data.metadata?.plan ?? null) as
      | 'pro_monthly'
      | 'pro_yearly'
      | null

    const patch: Partial<Doc<'users'>> = {}
    if (newStatus) patch.subscriptionStatus = newStatus
    if (periodEnd) patch.currentPeriodEndsAt = periodEnd
    if (planFromMeta) patch.plan = planFromMeta
    if (data.customer?.id) patch.polarCustomerId = data.customer.id
    if (data.id) patch.polarSubscriptionId = data.id

    // Revocation / hard cancel
    if (type === 'subscription.revoked' || data.ended_at) {
      patch.subscriptionStatus = 'expired'
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch)
      await logActivity(ctx, {
        userId: user._id,
        action: 'update',
        entity: 'subscription',
        entityId: user._id,
        description: `Polar ${type}: status=${patch.subscriptionStatus ?? 'unchanged'}`,
      })
    }
  },
})

// ──────────────────────────────────────────────────────────────────────
// Demo mode + lifecycle helpers (unchanged from before)
// ──────────────────────────────────────────────────────────────────────

export const activateDemoPlan = mutation({
  args: { plan: v.union(v.literal('pro_monthly'), v.literal('pro_yearly')) },
  handler: async (ctx, { plan }) => {
    const user = await requireUser(ctx)
    const now = Date.now()
    const days = plan === 'pro_yearly' ? 365 : 30
    const currentPeriodEndsAt = now + days * 24 * 60 * 60 * 1000
    await ctx.db.patch(user._id, {
      subscriptionStatus: 'active',
      plan,
      currentPeriodEndsAt,
    })
    await logActivity(ctx, {
      userId: user._id,
      action: 'update',
      entity: 'subscription',
      entityId: user._id,
      description: `Activated ${plan} (demo mode)`,
    })
    return { ok: true }
  },
})

export const cancel = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    await ctx.db.patch(user._id, {
      subscriptionStatus: 'cancelled',
    })
    await logActivity(ctx, {
      userId: user._id,
      action: 'update',
      entity: 'subscription',
      entityId: user._id,
      description: `Cancelled subscription`,
    })
    return { ok: true }
  },
})

export const dev_expireTrial = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    await ctx.db.patch(user._id, {
      subscriptionStatus: 'expired',
      trialEndsAt: Date.now() - 1000,
    })
    return { ok: true }
  },
})

export const dev_resetTrial = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const TRIAL_MS = 3 * 24 * 60 * 60 * 1000
    await ctx.db.patch(user._id, {
      subscriptionStatus: 'trialing',
      plan: undefined,
      trialEndsAt: Date.now() + TRIAL_MS,
      currentPeriodEndsAt: undefined,
    })
    return { ok: true }
  },
})

// Silence ts unused-import warning when no internal calls present
void internal
