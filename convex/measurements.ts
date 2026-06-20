import { v } from 'convex/values'
import { mutation, query, MutationCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { UNITS } from './schema'
import { requireUser, getCurrentUser } from './users'
import { logActivity } from './activities'

async function nextCode(ctx: MutationCtx) {
  const counter = await ctx.db
    .query('counters')
    .withIndex('by_name', (q) => q.eq('name', 'measurement'))
    .unique()
  const next = (counter?.value ?? 0) + 1
  if (counter) await ctx.db.patch(counter._id, { value: next })
  else await ctx.db.insert('counters', { name: 'measurement', value: next })
  return `MES-${String(next).padStart(4, '0')}`
}

const baseFields = {
  customerName: v.string(),
  phoneNumber: v.string(),
  productType: v.string(),
  length: v.number(),
  width: v.number(),
  height: v.number(),
  unit: UNITS,
  quantity: v.number(),
  notes: v.optional(v.string()),
  assignedTo: v.optional(v.id('users')),
}

export const create = mutation({
  args: baseFields,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const code = await nextCode(ctx)
    const now = Date.now()
    const id = await ctx.db.insert('measurements', {
      ...args,
      code,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    })
    await logActivity(ctx, {
      userId: user._id,
      action: 'create',
      entity: 'measurement',
      entityId: id,
      description: `Created measurement ${code} for ${args.customerName}`,
    })
    return id
  },
})

export const update = mutation({
  args: { id: v.id('measurements'), ...baseFields },
  handler: async (ctx, { id, ...patch }) => {
    const user = await requireUser(ctx)
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error('Measurement not found')
    if (user.role !== 'admin' && existing.createdBy !== user._id) {
      throw new Error('Not authorized to edit this measurement')
    }
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() })
    await logActivity(ctx, {
      userId: user._id,
      action: 'update',
      entity: 'measurement',
      entityId: id,
      description: `Updated measurement ${existing.code}`,
    })
    return id
  },
})

export const remove = mutation({
  args: { id: v.id('measurements') },
  handler: async (ctx, { id }) => {
    const user = await requireUser(ctx)
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error('Measurement not found')
    if (user.role !== 'admin' && existing.createdBy !== user._id) {
      throw new Error('Not authorized to delete this measurement')
    }
    await ctx.db.delete(id)
    await logActivity(ctx, {
      userId: user._id,
      action: 'delete',
      entity: 'measurement',
      entityId: id,
      description: `Deleted measurement ${existing.code}`,
    })
    return id
  },
})

export type ListFilters = {
  search?: string
  startDate?: number
  endDate?: number
  customer?: string
}

async function hydrate(ctx: any, rows: Doc<'measurements'>[]) {
  const userIds = Array.from(
    new Set(
      rows.flatMap((r) => [r.createdBy, r.assignedTo].filter(Boolean) as Id<'users'>[]),
    ),
  )
  const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))
  const map = new Map<string, Doc<'users'>>()
  for (const u of users) if (u) map.set(u._id, u)
  return rows.map((r) => ({
    ...r,
    creator: map.get(r.createdBy) ?? null,
    assignee: r.assignedTo ? (map.get(r.assignedTo) ?? null) : null,
  }))
}

export const list = query({
  args: {
    search: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    customer: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    let rows: Doc<'measurements'>[]

    if (user.role === 'admin') {
      rows = await ctx.db
        .query('measurements')
        .withIndex('by_created_at')
        .order('desc')
        .collect()
    } else {
      const owned = await ctx.db
        .query('measurements')
        .withIndex('by_creator', (q) => q.eq('createdBy', user._id))
        .collect()
      const assigned = await ctx.db
        .query('measurements')
        .withIndex('by_assignee', (q) => q.eq('assignedTo', user._id))
        .collect()
      const seen = new Set<string>()
      rows = [...owned, ...assigned].filter((r) => {
        if (seen.has(r._id)) return false
        seen.add(r._id)
        return true
      })
      rows.sort((a, b) => b.createdAt - a.createdAt)
    }

    const term = args.search?.trim().toLowerCase()
    if (term) {
      rows = rows.filter((r) =>
        [r.code, r.customerName, r.phoneNumber, r.productType]
          .join(' ')
          .toLowerCase()
          .includes(term),
      )
    }
    if (args.customer) {
      const c = args.customer.toLowerCase()
      rows = rows.filter((r) => r.customerName.toLowerCase().includes(c))
    }
    if (args.startDate)
      rows = rows.filter((r) => r.createdAt >= args.startDate!)
    if (args.endDate) rows = rows.filter((r) => r.createdAt <= args.endDate!)
    if (args.limit) rows = rows.slice(0, args.limit)

    return await hydrate(ctx, rows)
  },
})

export const get = query({
  args: { id: v.id('measurements') },
  handler: async (ctx, { id }) => {
    await requireUser(ctx)
    const row = await ctx.db.get(id)
    if (!row) return null
    const [creator, assignee] = await Promise.all([
      ctx.db.get(row.createdBy),
      row.assignedTo ? ctx.db.get(row.assignedTo) : Promise.resolve(null),
    ])
    return { ...row, creator, assignee }
  },
})

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return null

    const all =
      user.role === 'admin'
        ? await ctx.db.query('measurements').collect()
        : [
            ...(await ctx.db
              .query('measurements')
              .withIndex('by_creator', (q) => q.eq('createdBy', user._id))
              .collect()),
            ...(await ctx.db
              .query('measurements')
              .withIndex('by_assignee', (q) => q.eq('assignedTo', user._id))
              .collect()),
          ]

    const now = new Date()
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime()
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime()

    const today = all.filter((m) => m.createdAt >= startOfDay).length
    const month = all.filter((m) => m.createdAt >= startOfMonth).length

    // 12-month trend
    const trend: { month: string; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const count = all.filter(
        (m) => m.createdAt >= d.getTime() && m.createdAt < next.getTime(),
      ).length
      trend.push({
        month: d.toLocaleString('default', { month: 'short' }),
        count,
      })
    }

    return {
      total: all.length,
      today,
      month,
      trend,
    }
  },
})
