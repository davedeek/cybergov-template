import { db } from './index'
import { organizationMemberships, organizations, todos } from './schema'

async function main() {
  const [organization] = await db
    .insert(organizations)
    .values({ name: 'Demo Workspace' })
    .returning()

  await db.insert(organizationMemberships).values({
    organizationId: organization.id,
    userId: 'seed-user',
    role: 'owner',
  })

  await db.insert(todos).values([
    {
      organizationId: organization.id,
      createdByUserId: 'seed-user',
      name: 'Welcome to your SaaS starter',
    },
    {
      organizationId: organization.id,
      createdByUserId: 'seed-user',
      name: 'Invite teammates and start building',
    },
  ])
}

main()

