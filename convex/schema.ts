import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const ROLES = v.union(v.literal('admin'), v.literal('employee'))
export const UNITS = v.union(
  v.literal('cm'),
  v.literal('mm'),
  v.literal('inch'),
  v.literal('ft'),
)
export const ACTIVITY_ACTIONS = v.union(
  v.literal('create'),
  v.literal('update'),
  v.literal('delete'),
)

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: ROLES,
    createdAt: v.number(),
  }).index('by_clerk_id', ['clerkId']),

  measurements: defineTable({
    // Auto-generated human-readable id like MES-0001
    code: v.string(),
    customerName: v.string(),
    phoneNumber: v.string(),
    productType: v.string(),
    length: v.number(),
    width: v.number(),
    height: v.number(),
    unit: UNITS,
    quantity: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id('users'),
    assignedTo: v.optional(v.id('users')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_code', ['code'])
    .index('by_creator', ['createdBy'])
    .index('by_assignee', ['assignedTo'])
    .index('by_created_at', ['createdAt']),

  activities: defineTable({
    userId: v.id('users'),
    action: ACTIVITY_ACTIONS,
    entity: v.string(),
    entityId: v.string(),
    description: v.string(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_created_at', ['createdAt']),

  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index('by_name', ['name']),

  apps: defineTable({
    name: v.string(),
    type: v.union(
      v.literal('web'),
      v.literal('mobile'),
      v.literal('desktop'),
    ),
    stack: v.object({
      frontend: v.array(v.string()),
      backend: v.array(v.string()),
      database: v.array(v.string()),
      auth: v.array(v.string()),
      apis: v.array(v.string()),
    }),
    source: v.union(v.literal('blank'), v.literal('github')),
    createdBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_creator', ['createdBy'])
    .index('by_created_at', ['createdAt']),
})
