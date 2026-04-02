/**
 * Unified event taxonomy for analytics + audit + server logging.
 * Use these constants in both client-side analytics calls and server-side audit/log calls
 * to ensure dashboards and logs share the same event names.
 */
export const EVENTS = {
  // Auth
  SIGNUP: 'signup',
  SIGNIN: 'signin',
  SIGNOUT: 'signout',

  // Organization
  ORG_CREATED: 'org.created',
  MEMBER_INVITED: 'member.invited',
  MEMBER_ROLE_UPDATED: 'member.role_updated',

  // Work Simplification
  UNIT_CREATED: 'unit.created',
  PROCESS_CHART_CREATED: 'process_chart.created',
  WDC_CREATED: 'wdc.created',
  WORK_COUNT_CREATED: 'work_count.created',
  STEP_ADDED: 'step.added',
  STEP_UPDATED: 'step.updated',
  STEP_DELETED: 'step.deleted',
  EMPLOYEE_ADDED: 'employee.added',
  ACTIVITY_ADDED: 'activity.added',
  TASK_ADDED: 'task.added',
  ANNOTATION_ADDED: 'annotation.added',
  EXAMPLE_DATA_IMPORTED: 'example_data.imported',

  // Sharing
  CHART_SHARED: 'chart.shared',
  SHARE_TOKEN_REGENERATED: 'share_token.regenerated',
  SHARE_LINK_ACCESSED: 'share_link.accessed',
  SHARE_LINK_COPIED: 'share_link.copied',

  // General
  TODO_CREATED: 'todo.created',
  TODO_UPDATED: 'todo.updated',
  TODO_DELETED: 'todo.deleted',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

// Audit action verbs
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ACCESS: 'access',
} as const
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

// Audit entity types
export const ENTITY_TYPES = {
  ORGANIZATION: 'organization',
  INVITATION: 'invitation',
  MEMBER_ROLE: 'member_role',
  TODO: 'todo',
  UNIT: 'unit',
  PROCESS_CHART: 'process_chart',
  PROCESS_STEP: 'process_step',
  PROCESS_CHART_STEPS: 'process_chart_steps',
  STEP_ANNOTATION: 'step_annotation',
  WDC_CHART: 'wdc_chart',
  WDC_EMPLOYEE: 'wdc_employee',
  WDC_ACTIVITY: 'wdc_activity',
  WDC_TASK: 'wdc_task',
  WORK_COUNT: 'work_count',
  SHARE_TOKEN: 'share_token',
  PROPOSED_CHANGE: 'proposed_change',
} as const
export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES]
