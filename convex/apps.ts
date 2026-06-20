import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUser } from './users'
import { logActivity } from './activities'

const stackValidator = v.object({
  frontend: v.array(v.string()),
  backend: v.array(v.string()),
  database: v.array(v.string()),
  auth: v.array(v.string()),
  apis: v.array(v.string()),
})

const APP_TYPES = v.union(
  v.literal('web'),
  v.literal('mobile'),
  v.literal('desktop'),
)

export const create = mutation({
  args: {
    name: v.string(),
    type: APP_TYPES,
    stack: stackValidator,
    source: v.optional(v.union(v.literal('blank'), v.literal('github'))),
  },
  handler: async (ctx, { name, type, stack, source }) => {
    const user = await requireUser(ctx)
    const trimmed = name.trim()
    if (!trimmed) throw new Error('App name is required')
    if (trimmed.length > 80) throw new Error('App name is too long')

    const id = await ctx.db.insert('apps', {
      name: trimmed,
      type,
      stack,
      source: source ?? 'blank',
      createdBy: user._id,
      createdAt: Date.now(),
    })
    await logActivity(ctx, {
      userId: user._id,
      action: 'create',
      entity: 'app',
      entityId: id,
      description: `Created app "${trimmed}" (${type})`,
    })
    return id
  },
})

export const myApps = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    return await ctx.db
      .query('apps')
      .withIndex('by_creator', (q) => q.eq('createdBy', user._id))
      .order('desc')
      .collect()
  },
})

export const get = query({
  args: { id: v.id('apps') },
  handler: async (ctx, { id }) => {
    await requireUser(ctx)
    return await ctx.db.get(id)
  },
})
