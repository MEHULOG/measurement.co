import { v } from 'convex/values'
import { mutation, query, action } from './_generated/server'
import { Doc } from './_generated/dataModel'
import { api } from './_generated/api'
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
 * Compute whether the current user has access to the app right now.
 * Used by the route guard and the topbar trial badge.
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
    }
  },
})

/**
 * Demo / fallback checkout: marks the user as actively subscribed for the
 * picked plan period.
 *
 * Production: replace the body with a Stripe Checkout Session creation
 * (read `STRIPE_SECRET_KEY` from `process.env`, call the REST API, return
 * the hosted-checkout URL). The `webhook` HTTP route would then flip
 * subscriptionStatus → 'active' on `checkout.session.completed`. Until
 * those env vars are present this mock path runs so the flow is testable
 * end-to-end without Stripe credentials.
 */
export const startCheckout = action({
  args: { plan: v.union(v.literal('pro_monthly'), v.literal('pro_yearly')) },
  handler: async (ctx, { plan }): Promise<{ url: string; mode: 'demo' | 'stripe' }> => {
    const hasStripe = !!process.env.STRIPE_SECRET_KEY
    if (hasStripe) {
      // Stripe integration goes here. Intentionally not implemented in this
      // scaffold — keep this branch a clear extension point.
      throw new Error(
        'STRIPE_SECRET_KEY is set but the Stripe integration has not been wired yet. Implement Stripe Checkout in convex/billing.ts → startCheckout.',
      )
    }
    // Demo mode: activate immediately (so you can develop the rest of the
    // flow without Stripe credentials).
    await ctx.runMutation(api.billing.activateDemoPlan, { plan })
    return { url: '/app/billing?demo=success', mode: 'demo' }
  },
})

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

/**
 * Dev helper: lets the developer push their trial expiry into the past so
 * the gating screen can be tested without waiting 3 days. Not callable by
 * employees of real users in production deployments — gate by env var.
 */
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
