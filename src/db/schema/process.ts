import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { units } from './units'

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
  chartState: text('chart_state', { enum: ['current', 'proposed'] })
    .notNull()
    .default('current'),
  linkedChartId: integer('linked_chart_id'),
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
  notes: text(),
})

export const stepAnnotations = sqliteTable('step_annotations', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  stepId: integer('step_id')
    .notNull()
    .references(() => processSteps.id, { onDelete: 'cascade' }),
  question: text({ enum: ['what', 'why', 'where', 'when', 'who', 'how'] }).notNull(),
  note: text().notNull(),
  proposedAction: text('proposed_action', {
    enum: ['eliminate', 'combine', 'reorder', 'delegate', 'simplify', 'none'],
  })
    .notNull()
    .default('none'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})
