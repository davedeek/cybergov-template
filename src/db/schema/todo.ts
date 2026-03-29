import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'
import { organizations } from './orgs'

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
