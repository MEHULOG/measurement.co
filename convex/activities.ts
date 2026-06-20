import { v } from 'convex/values'
import { query, MutationCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { ACTIVITY_ACTIONS } from './schema'
import { requireUser } from './users'

export async function logActivity(
  ctx: MutationCtx,
  args: {
    userId: Id<'users'>
    action: 'create' | 'update' | 'delete'
    entity: string
    entityId: string
    description: string
  },
) {
  await ctx.db.insert('activities', { ...args, createdAt: Date.now() })
}

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    await requireUser(ctx)
    const rows = await ctx.db
      .query('activities')
      .withIndex('by_created_at')
      .order('desc')
      .take(limit ?? 10)

    const userIds = Array.from(new Set(rows.map((r) => r.userId)))
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))
    const userMap = new Map<string, Doc<'users'>>()
    for (const u of users) if (u) userMap.set(u._id, u)

    return rows.map((row) => ({
      ...row,
      user: userMap.get(row.userId) ?? null,
    }))
  },
})

// Re-export the action validator so it can be used from typed helpers.
export { ACTIVITY_ACTIONS }
