import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { processCharts, processSteps } from './process'

export const workCounts = sqliteTable('work_counts', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  processChartId: integer('process_chart_id')
    .notNull()
    .references(() => processCharts.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  period: text({ enum: ['daily', 'weekly', 'monthly'] })
    .notNull()
    .default('weekly'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const workCountEntries = sqliteTable('work_count_entries', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  workCountId: integer('work_count_id')
    .notNull()
    .references(() => workCounts.id, { onDelete: 'cascade' }),
  stepId: integer('step_id')
    .notNull()
    .references(() => processSteps.id, { onDelete: 'cascade' }),
  count: integer().notNull().default(0),
  recordedAt: integer('recorded_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})
