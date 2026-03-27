import { sqliteTable, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ─── Better Auth tables ────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`),
})

// ─── Application tables ────────────────────────────────────────────────────────

export const organizations = sqliteTable('organizations', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const organizationMemberships = sqliteTable(
  'organization_memberships',
  {
    id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    organizationId: integer('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text({ enum: ['owner', 'admin', 'member'] })
      .notNull()
      .default('member'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    organizationUserUnique: uniqueIndex('org_membership_org_user_uq').on(
      table.organizationId,
      table.userId,
    ),
  }),
)

export const invitations = sqliteTable('invitations', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text().notNull(),
  role: text({ enum: ['admin', 'member'] })
    .notNull()
    .default('member'),
  invitedByUserId: text('invited_by_user_id')
    .notNull()
    .references(() => users.id),
  status: text({ enum: ['pending', 'accepted', 'declined'] })
    .notNull()
    .default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const todos = sqliteTable('todos', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdByUserId: text('created_by_user_id')
    .notNull()
    .references(() => users.id),
  name: text().notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// ─── Work Simplification tables ────────────────────────────────────────────────

export const units = sqliteTable('units', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  description: text(),
  createdByUserId: text('created_by_user_id')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// ─── Work Distribution Chart ───────────────────────────────────────────────────

export const wdcCharts = sqliteTable('wdc_charts', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  unitId: integer('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  snapshotDate: integer('snapshot_date', { mode: 'timestamp' }),
  hoursThreshold: integer('hours_threshold').notNull().default(40),
  shareToken: text('share_token').unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const wdcEmployees = sqliteTable('wdc_employees', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  wdcChartId: integer('wdc_chart_id')
    .notNull()
    .references(() => wdcCharts.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  role: text(),
  fte: text().notNull().default('1.0'), // stored as text for SQLite, parsed as number
  sortOrder: integer('sort_order').notNull().default(0),
})

export const wdcActivities = sqliteTable('wdc_activities', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  wdcChartId: integer('wdc_chart_id')
    .notNull()
    .references(() => wdcCharts.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const wdcTasks = sqliteTable('wdc_tasks', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  wdcChartId: integer('wdc_chart_id')
    .notNull()
    .references(() => wdcCharts.id, { onDelete: 'cascade' }),
  employeeId: integer('employee_id')
    .notNull()
    .references(() => wdcEmployees.id, { onDelete: 'cascade' }),
  activityId: integer('activity_id')
    .notNull()
    .references(() => wdcActivities.id, { onDelete: 'cascade' }),
  taskName: text('task_name').notNull(),
  hoursPerWeek: integer('hours_per_week').notNull(),
})

// ─── Process Chart ─────────────────────────────────────────────────────────────

export const processCharts = sqliteTable('process_charts', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  unitId: integer('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  startPoint: text('start_point'),
  endPoint: text('end_point'),
  storageWarnMinutes: integer('storage_warn_minutes').notNull().default(480),
  distanceWarnFeet: integer('distance_warn_feet').notNull().default(200),
  shareToken: text('share_token'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const processSteps = sqliteTable('process_steps', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  processChartId: integer('process_chart_id')
    .notNull()
    .references(() => processCharts.id, { onDelete: 'cascade' }),
  sequenceNumber: integer('sequence_number').notNull(),
  symbol: text({ enum: ['operation', 'transportation', 'storage', 'inspection'] }).notNull(),
  description: text().notNull(),
  who: text(),
  minutes: integer(),
  feet: integer(),
})

export const stepAnnotations = sqliteTable('step_annotations', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  stepId: integer('step_id')
    .notNull()
    .references(() => processSteps.id, { onDelete: 'cascade' }),
  question: text({ enum: ['what', 'why', 'where', 'when', 'who', 'how'] }).notNull(),
  note: text().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// ─── Proposed Changes (applies to both WDC and Process Charts) ─────────────

export const proposedChanges = sqliteTable('proposed_changes', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  unitId: integer('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  chartType: text('chart_type', { enum: ['wdc', 'process_chart'] }).notNull(),
  chartId: integer('chart_id').notNull(),
  description: text().notNull(),
  beforeState: text('before_state'),
  afterState: text('after_state'),
  status: text({ enum: ['open', 'accepted', 'dismissed'] }).notNull().default('open'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})
