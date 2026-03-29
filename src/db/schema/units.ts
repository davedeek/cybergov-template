import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'
import { organizations } from './orgs'

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
