import { describe, it, expect, beforeEach } from 'vitest'
import { createTestCaller, db } from './setup'
import { organizations, organizationMemberships, users } from '../db/schema'

describe('Organization Router', () => {
  const userA = { id: 'user-a', name: 'User A', email: 'a@example.com' }
  const userB = { id: 'user-b', name: 'User B', email: 'b@example.com' }
  let orgAId: number

  beforeEach(async () => {
    await db.insert(users).values([
      { ...userA, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
      { ...userB, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
    ])

    const [orgA] = await db.insert(organizations).values({ name: 'Org A' }).returning()
    orgAId = orgA.id

    await db.insert(organizationMemberships).values([
      { organizationId: orgA.id, userId: userA.id, role: 'owner' },
    ])
  })

  describe('create', () => {
    it('creates both org and membership atomically', async () => {
      const caller = createTestCaller(userB)
      const result = await caller.organization.create({ name: 'New Org' })

      expect(result.organization.name).toBe('New Org')
      expect(result.membership.role).toBe('owner')
      expect(result.membership.userId).toBe(userB.id)
      expect(result.membership.organizationId).toBe(result.organization.id)
    })

    it('sets caller as owner', async () => {
      const caller = createTestCaller(userB)
      const result = await caller.organization.create({ name: 'My Org' })
      expect(result.membership.role).toBe('owner')
    })
  })

  describe('listMembers', () => {
    it('returns members of the org', async () => {
      const caller = createTestCaller(userA)
      const members = await caller.organization.listMembers({ organizationId: orgAId })
      expect(members).toHaveLength(1)
      expect(members[0].userId).toBe(userA.id)
    })

    it('rejects non-members', async () => {
      const caller = createTestCaller(userB)
      await expect(caller.organization.listMembers({ organizationId: orgAId }))
        .rejects.toThrow()
    })
  })

  describe('updateMemberRole', () => {
    it('updates only the target user — not all members', async () => {
      // Add a second member
      const [orgA2] = await db.insert(organizations).values({ name: 'Org A2' }).returning()
      await db.insert(organizationMemberships).values([
        { organizationId: orgA2.id, userId: userA.id, role: 'owner' },
        { organizationId: orgA2.id, userId: userB.id, role: 'member' },
      ])

      const caller = createTestCaller(userA)
      await caller.organization.updateMemberRole({
        organizationId: orgA2.id,
        userId: userB.id,
        role: 'admin',
      })

      const memberships = await db.query.organizationMemberships.findMany()
      const aMembership = memberships.find(m => m.userId === userA.id && m.organizationId === orgA2.id)
      const bMembership = memberships.find(m => m.userId === userB.id && m.organizationId === orgA2.id)

      expect(aMembership?.role).toBe('owner') // userA's role unchanged
      expect(bMembership?.role).toBe('admin') // only userB updated
    })

    it('throws NOT_FOUND for a userId not in the org', async () => {
      const caller = createTestCaller(userA)
      await expect(
        caller.organization.updateMemberRole({
          organizationId: orgAId,
          userId: 'nonexistent-user',
          role: 'admin',
        })
      ).rejects.toThrow('not a member')
    })

    it('rejects non-owners/admins', async () => {
      const [orgC] = await db.insert(organizations).values({ name: 'Org C' }).returning()
      await db.insert(organizationMemberships).values([
        { organizationId: orgC.id, userId: userA.id, role: 'member' },
        { organizationId: orgC.id, userId: userB.id, role: 'member' },
      ])

      const caller = createTestCaller(userA)
      await expect(
        caller.organization.updateMemberRole({
          organizationId: orgC.id,
          userId: userB.id,
          role: 'admin',
        })
      ).rejects.toThrow()
    })
  })

  describe('invite', () => {
    it('creates an invitation record', async () => {
      const caller = createTestCaller(userA)
      const invite = await caller.organization.invite({
        organizationId: orgAId,
        email: 'new@example.com',
        role: 'member',
      })
      expect(invite.email).toBe('new@example.com')
      expect(invite.role).toBe('member')
      expect(invite.organizationId).toBe(orgAId)
    })

    it('rejects invitation from non-owner/admin', async () => {
      const [orgC] = await db.insert(organizations).values({ name: 'Org C' }).returning()
      await db.insert(organizationMemberships).values({
        organizationId: orgC.id, userId: userB.id, role: 'member',
      })

      const caller = createTestCaller(userB)
      await expect(
        caller.organization.invite({ organizationId: orgC.id, email: 'x@x.com', role: 'member' })
      ).rejects.toThrow()
    })
  })
})
