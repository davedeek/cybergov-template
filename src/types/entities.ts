import type { InferSelectModel } from 'drizzle-orm'
import type {
  todos,
  organizations,
  organizationMemberships,
  units,
  processCharts,
  processSteps,
  stepAnnotations,
  proposedChanges,
  workCounts,
  workCountEntries,
  wdcCharts,
  wdcEmployees,
  wdcActivities,
  wdcTasks,
} from '@/db/schema'

export type Todo = InferSelectModel<typeof todos>
export type Organization = InferSelectModel<typeof organizations>
export type OrganizationMembership = InferSelectModel<typeof organizationMemberships>
export type Unit = InferSelectModel<typeof units>
export type ProcessChart = InferSelectModel<typeof processCharts>
export type ProcessStep = InferSelectModel<typeof processSteps>
export type StepAnnotation = InferSelectModel<typeof stepAnnotations>
export type ProposedChange = InferSelectModel<typeof proposedChanges>
export type WorkCount = InferSelectModel<typeof workCounts>
export type WorkCountEntry = InferSelectModel<typeof workCountEntries>
export type WdcChart = InferSelectModel<typeof wdcCharts>
export type WdcEmployee = InferSelectModel<typeof wdcEmployees>
export type WdcActivity = InferSelectModel<typeof wdcActivities>
export type WdcTask = InferSelectModel<typeof wdcTasks>
