import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { units } from './units'

export const proposedChanges = sqliteTable('proposed_changes', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  unitId: integer('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  chartType: text('chart_type', { enum: ['wdc', 'process_chart', 'work_count'] }).notNull(),
  chartId: integer('chart_id').notNull(),
  description: text().notNull(),
  beforeState: text('before_state'),
  afterState: text('after_state'),
  status: text({ enum: ['open', 'accepted', 'dismissed'] })
    .notNull()
    .default('open'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})
