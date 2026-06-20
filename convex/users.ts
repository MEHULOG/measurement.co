import { v } from 'convex/values'
import { mutation, query, QueryCtx, MutationCtx } from './_generated/server'
import { Doc } from './_generated/dataModel'
import { ROLES } from './schema'

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null
  return await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .unique()
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx)
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx)
  if (user.role !== 'admin') throw new Error('Admin access required')
  return user
}

/**
 * Called from the client right after Clerk sign-in. Creates the corresponding
 * users row on first login (the very first user becomes admin).
 */
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (existing) {
      // Keep profile fields fresh.
      const patch: Partial<Doc<'users'>> = {}
      if (identity.email && existing.email !== identity.email)
        patch.email = identity.email
      if (identity.name && existing.name !== identity.name)
        patch.name = identity.name
      if (identity.pictureUrl && existing.imageUrl !== identity.pictureUrl)
        patch.imageUrl = identity.pictureUrl
      if (Object.keys(patch).length) await ctx.db.patch(existing._id, patch)
      return existing._id
    }

    const userCount = (await ctx.db.query('users').collect()).length
    const role = userCount === 0 ? 'admin' : 'employee'

    return await ctx.db.insert('users', {
      clerkId: identity.subject,
      email: identity.email ?? 'unknown@example.com',
      name: identity.name ?? identity.email ?? 'Anonymous',
      imageUrl: identity.pictureUrl ?? undefined,
      role,
      createdAt: Date.now(),
    })
  },
})

export const me = query({
  args: {},
  handler: async (ctx) => getCurrentUser(ctx),
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const users = await ctx.db.query('users').collect()
    return users.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const updateRole = mutation({
  args: { userId: v.id('users'), role: ROLES },
  handler: async (ctx, { userId, role }) => {
    const admin = await requireAdmin(ctx)
    if (admin._id === userId) throw new Error('You cannot change your own role')
    await ctx.db.patch(userId, { role })
    return userId
  },
})

export const remove = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const admin = await requireAdmin(ctx)
    if (admin._id === userId) throw new Error('You cannot delete yourself')
    await ctx.db.delete(userId)
    return userId
  },
})
