import { sqliteTable, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'

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
