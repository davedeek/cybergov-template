import { describe, it, expect, beforeEach } from 'vitest'
import { createTestCaller, db } from './setup'
import { organizations, organizationMemberships, users } from '../db/schema'

describe('Units Router', () => {
  const userA = { id: 'user-a', name: 'User A', email: 'a@example.com' }
  const userB = { id: 'user-b', name: 'User B', email: 'b@example.com' }
  let orgAId: number
  let orgBId: number

  beforeEach(async () => {
    await db.insert(users).values([
      { ...userA, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
      { ...userB, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
    ])

    const [orgA] = await db.insert(organizations).values({ name: 'Org A' }).returning()
    const [orgB] = await db.insert(organizations).values({ name: 'Org B' }).returning()
    orgAId = orgA.id
    orgBId = orgB.id

    await db.insert(organizationMemberships).values([
      { organizationId: orgA.id, userId: userA.id, role: 'owner' },
      { organizationId: orgB.id, userId: userB.id, role: 'owner' },
    ])
  })

  describe('create', () => {
    it('creates a unit in the org', async () => {
      const caller = createTestCaller(userA)
      const unit = await caller.ws.units.create({
        organizationId: orgAId,
        name: 'Records Processing',
        description: 'Handles records',
      })
      expect(unit.name).toBe('Records Processing')
      expect(unit.organizationId).toBe(orgAId)
      expect(unit.createdByUserId).toBe(userA.id)
    })

    it('rejects creation for non-members', async () => {
      const caller = createTestCaller(userA)
      await expect(
        caller.ws.units.create({ organizationId: orgBId, name: 'Hacked Unit' })
      ).rejects.toThrow()
    })
  })

  describe('list', () => {
    it('lists units belonging to the org', async () => {
      const callerA = createTestCaller(userA)
      await callerA.ws.units.create({ organizationId: orgAId, name: 'Unit 1' })
      await callerA.ws.units.create({ organizationId: orgAId, name: 'Unit 2' })

      const units = await callerA.ws.units.list({ organizationId: orgAId })
      expect(units).toHaveLength(2)
    })

    it('does not return units from other orgs (tenant isolation)', async () => {
      const callerA = createTestCaller(userA)
      await callerA.ws.units.create({ organizationId: orgAId, name: 'Org A Unit' })

      // User B should not see Org A's units
      const callerB = createTestCaller(userB)
      await expect(
        callerB.ws.units.list({ organizationId: orgAId })
      ).rejects.toThrow()
    })
  })
})
