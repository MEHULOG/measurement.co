import { Doc, Id } from '../../convex/_generated/dataModel'

export type Role = 'admin' | 'employee'
export type Unit = 'cm' | 'mm' | 'inch' | 'ft'

export type User = Doc<'users'>
export type Measurement = Doc<'measurements'>
export type Activity = Doc<'activities'>

export type MeasurementWithUsers = Measurement & {
  creator: User | null
  assignee: User | null
}

export type ActivityWithUser = Activity & {
  user: User | null
}

export type UserId = Id<'users'>
export type MeasurementId = Id<'measurements'>
