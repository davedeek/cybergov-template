import { db } from './index'
import {
  organizationMemberships,
  organizations,
  todos,
  users,
} from './schema'

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seed script must not run in production')
    process.exit(1)
  }

  const [user] = await db
    .insert(users)
    .values({
      id: 'seed-user',
      name: 'Test Administrator',
      email: 'admin@example.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  const [organization] = await db
    .insert(organizations)
    .values({ name: 'Demo Workspace' })
    .returning()

  await db.insert(organizationMemberships).values({
    organizationId: organization.id,
    userId: user.id,
    role: 'owner',
  })

  await db.insert(todos).values([
    {
      organizationId: organization.id,
      createdByUserId: user.id,
      name: 'Welcome to your SaaS starter',
    },
    {
      organizationId: organization.id,
      createdByUserId: user.id,
      name: 'Invite teammates and start building',
    },
  ])
}

main()
