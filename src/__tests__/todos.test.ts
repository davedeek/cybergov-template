import { describe, it, expect, beforeEach } from 'vitest'
import { createTestCaller, db } from './setup'
import { organizations, organizationMemberships, users } from '../db/schema'

describe('Tenant Isolation (Todos)', () => {
  let userA = { id: 'user-a', name: 'User A', email: 'a@example.com' }
  let userB = { id: 'user-b', name: 'User B', email: 'b@example.com' }
  let orgAId: number
  let orgBId: number

  beforeEach(async () => {
    // Insert test users
    await db.insert(users).values([
      ...[userA, userB].map(u => ({
        ...u,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    ])

    // Insert Orgs
    const [orgA] = await db.insert(organizations).values({ name: 'Org A' }).returning()
    const [orgB] = await db.insert(organizations).values({ name: 'Org B' }).returning()
    orgAId = orgA.id
    orgBId = orgB.id

    // Setup memberships: user A belongs to Org A, user B belongs to Org B
    await db.insert(organizationMemberships).values([
      { organizationId: orgA.id, userId: userA.id, role: 'owner' },
      { organizationId: orgB.id, userId: userB.id, role: 'owner' },
    ])
  })

  it('should allow a member to add and list todos in their organization', async () => {
    const caller = createTestCaller(userA)

    // Add todo to Org A
    const newTodo = await caller.todos.add({
      organizationId: orgAId,
      name: 'Task for Org A',
    })
    expect(newTodo.name).toBe('Task for Org A')

    // List todos in Org A
    const todos = await caller.todos.list({ organizationId: orgAId })
    expect(todos).toHaveLength(1)
    expect(todos[0].name).toBe('Task for Org A')
  })

  it('should reject requests for organizations the user is not a member of', async () => {
    // User A trying to access Org B
    const caller = createTestCaller(userA)

    await expect(caller.todos.list({ organizationId: orgBId }))
      .rejects.toThrowError('You are not a member of this organization')

    await expect(caller.todos.add({ organizationId: orgBId, name: 'Hacked Task' }))
      .rejects.toThrowError('You are not a member of this organization')
  })
})
