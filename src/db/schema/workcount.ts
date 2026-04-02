import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { units } from './units'
import { processSteps } from './process'

export const workCounts = sqliteTable('work_counts', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  unitId: integer('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  period: text({ enum: ['daily', 'weekly', 'monthly'] })
    .notNull()
    .default('weekly'),
  shareToken: text('share_token'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const workCountEntries = sqliteTable('work_count_entries', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  workCountId: integer('work_count_id')
    .notNull()
    .references(() => workCounts.id, { onDelete: 'cascade' }),
  stepId: integer('step_id').references(() => processSteps.id, {
    onDelete: 'set null',
  }),
  description: text().notNull(),
  sequenceNumber: integer('sequence_number').notNull().default(0),
  count: integer().notNull().default(0),
  recordedAt: integer('recorded_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})
