import { v } from 'convex/values'
import { query } from './_generated/server'
import { requireUser } from './users'

export const range = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, { startDate, endDate }) => {
    const user = await requireUser(ctx)
    const all =
      user.role === 'admin'
        ? await ctx.db.query('measurements').collect()
        : await ctx.db
            .query('measurements')
            .withIndex('by_creator', (q) => q.eq('createdBy', user._id))
            .collect()

    const filtered = all.filter(
      (m) => m.createdAt >= startDate && m.createdAt <= endDate,
    )

    const byDay = new Map<string, number>()
    for (const m of filtered) {
      const d = new Date(m.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`
      byDay.set(key, (byDay.get(key) ?? 0) + 1)
    }

    return {
      total: filtered.length,
      rows: filtered.sort((a, b) => b.createdAt - a.createdAt),
      series: Array.from(byDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }
  },
})
