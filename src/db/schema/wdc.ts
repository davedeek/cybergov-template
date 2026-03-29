import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { units } from './units'

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
