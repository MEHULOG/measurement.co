import { v } from 'convex/values'
import { mutation, query, MutationCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { requireUser } from './users'
import { logActivity } from './activities'

const STATUS = v.union(
  v.literal('pending'),
  v.literal('in_progress'),
  v.literal('ready'),
  v.literal('delivered'),
  v.literal('cancelled'),
)

export type OrderStatus =
  | 'pending'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'cancelled'

async function nextOrderCode(ctx: MutationCtx) {
  const counter = await ctx.db
    .query('counters')
    .withIndex('by_name', (q) => q.eq('name', 'order'))
    .unique()
  const next = (counter?.value ?? 0) + 1
  if (counter) await ctx.db.patch(counter._id, { value: next })
  else await ctx.db.insert('counters', { name: 'order', value: next })
  return `ORD-${String(next).padStart(4, '0')}`
}

const baseFields = {
  customerName: v.string(),
  phoneNumber: v.optional(v.string()),
  productType: v.string(),
  quantity: v.number(),
  totalAmount: v.optional(v.number()),
  currency: v.optional(v.string()),
  notes: v.optional(v.string()),
  measurementId: v.optional(v.id('measurements')),
}

export const create = mutation({
  args: { ...baseFields, status: v.optional(STATUS) },
  handler: async (ctx, { status, ...args }) => {
    const user = await requireUser(ctx)
    const code = await nextOrderCode(ctx)
    const now = Date.now()
    const id = await ctx.db.insert('orders', {
      ...args,
      code,
      status: status ?? 'pending',
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    })
    await logActivity(ctx, {
      userId: user._id,
      action: 'create',
      entity: 'order',
      entityId: id,
      description: `Created order ${code} for ${args.customerName}`,
    })
    return id
  },
})

export const update = mutation({
  args: { id: v.id('orders'), ...baseFields },
  handler: async (ctx, { id, ...patch }) => {
    const user = await requireUser(ctx)
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error('Order not found')
    if (user.role !== 'admin' && existing.createdBy !== user._id) {
      throw new Error('Not authorized to edit this order')
    }
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() })
    await logActivity(ctx, {
      userId: user._id,
      action: 'update',
      entity: 'order',
      entityId: id,
      description: `Updated order ${existing.code}`,
    })
    return id
  },
})

export const setStatus = mutation({
  args: { id: v.id('orders'), status: STATUS },
  handler: async (ctx, { id, status }) => {
    const user = await requireUser(ctx)
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error('Order not found')
    if (user.role !== 'admin' && existing.createdBy !== user._id) {
      throw new Error('Not authorized to change this order')
    }
    const now = Date.now()
    const wasDelivered: boolean = existing.status === 'delivered'
    const patch: Partial<Doc<'orders'>> = { status, updatedAt: now }
    if (status === 'delivered') {
      patch.deliveredAt = now
      patch.deliveredBy = user._id
    } else if (wasDelivered) {
      // un-delivered → clear the audit fields
      patch.deliveredAt = undefined
      patch.deliveredBy = undefined
    }
    await ctx.db.patch(id, patch)
    await logActivity(ctx, {
      userId: user._id,
      action: 'update',
      entity: 'order',
      entityId: id,
      description: `Marked ${existing.code} as ${status}`,
    })
    return id
  },
})

export const remove = mutation({
  args: { id: v.id('orders') },
  handler: async (ctx, { id }) => {
    const user = await requireUser(ctx)
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error('Order not found')
    if (user.role !== 'admin' && existing.createdBy !== user._id) {
      throw new Error('Not authorized to delete this order')
    }
    await ctx.db.delete(id)
    await logActivity(ctx, {
      userId: user._id,
      action: 'delete',
      entity: 'order',
      entityId: id,
      description: `Deleted order ${existing.code}`,
    })
    return id
  },
})

async function hydrate(ctx: any, rows: Doc<'orders'>[]) {
  const userIds = Array.from(
    new Set(
      rows.flatMap(
        (r) =>
          [r.createdBy, r.deliveredBy].filter(Boolean) as Id<'users'>[],
      ),
    ),
  )
  const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))
  const map = new Map<string, Doc<'users'>>()
  for (const u of users) if (u) map.set(u._id, u)
  return rows.map((r) => ({
    ...r,
    creator: map.get(r.createdBy) ?? null,
    deliverer: r.deliveredBy ? (map.get(r.deliveredBy) ?? null) : null,
  }))
}

export const list = query({
  args: {
    status: v.optional(STATUS),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    let rows: Doc<'orders'>[]

    if (user.role === 'admin') {
      if (args.status) {
        rows = await ctx.db
          .query('orders')
          .withIndex('by_status', (q) => q.eq('status', args.status!))
          .order('desc')
          .collect()
      } else {
        rows = await ctx.db
          .query('orders')
          .withIndex('by_created_at')
          .order('desc')
          .collect()
      }
    } else {
      rows = await ctx.db
        .query('orders')
        .withIndex('by_creator', (q) => q.eq('createdBy', user._id))
        .collect()
      rows.sort((a, b) => b.createdAt - a.createdAt)
      if (args.status) rows = rows.filter((r) => r.status === args.status)
    }

    const term = args.search?.trim().toLowerCase()
    if (term) {
      rows = rows.filter((r) =>
        [r.code, r.customerName, r.productType, r.phoneNumber ?? '']
          .join(' ')
          .toLowerCase()
          .includes(term),
      )
    }
    if (args.limit) rows = rows.slice(0, args.limit)
    return await hydrate(ctx, rows)
  },
})

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const all =
      user.role === 'admin'
        ? await ctx.db.query('orders').collect()
        : await ctx.db
            .query('orders')
            .withIndex('by_creator', (q) => q.eq('createdBy', user._id))
            .collect()

    const counts: Record<OrderStatus, number> = {
      pending: 0,
      in_progress: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    }
    for (const o of all) counts[o.status as OrderStatus]++
    return {
      total: all.length,
      delivered: counts.delivered,
      pending: counts.pending,
      inProgress: counts.in_progress,
      ready: counts.ready,
      cancelled: counts.cancelled,
    }
  },
})
