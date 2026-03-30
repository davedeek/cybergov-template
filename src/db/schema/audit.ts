import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'

export const auditLogs = sqliteTable('audit_logs', {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => users.id),
  action: text().notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  details: text(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})
