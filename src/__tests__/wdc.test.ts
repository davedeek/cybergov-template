import { describe, it, expect, beforeEach } from 'vitest'
import { createTestCaller, db } from './setup'
import { organizations, organizationMemberships, users, units } from '../db/schema'

describe('WDC Router', () => {
  const userA = { id: 'user-a', name: 'User A', email: 'a@example.com' }
  const userB = { id: 'user-b', name: 'User B', email: 'b@example.com' }
  let orgAId: number
  let orgBId: number
  let unitAId: number
  let unitBId: number

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

    const [unitA] = await db.insert(units).values({
      organizationId: orgAId,
      name: 'Unit A',
      createdByUserId: userA.id,
    }).returning()
    const [unitB] = await db.insert(units).values({
      organizationId: orgBId,
      name: 'Unit B',
      createdByUserId: userB.id,
    }).returning()
    unitAId = unitA.id
    unitBId = unitB.id
  })

  describe('create', () => {
    it('creates a WDC chart with a non-null shareToken', async () => {
      const caller = createTestCaller(userA)
      const chart = await caller.ws.wdc.create({
        organizationId: orgAId,
        unitId: unitAId,
        name: 'Q3 Snapshot',
      })
      expect(chart.name).toBe('Q3 Snapshot')
      expect(chart.shareToken).toBeTruthy()
      expect(chart.shareToken).toHaveLength(64) // 32 bytes hex = 64 chars
    })

    it('rejects creation for units in another org', async () => {
      const caller = createTestCaller(userA)
      await expect(
        caller.ws.wdc.create({ organizationId: orgAId, unitId: unitBId, name: 'Hacked' })
      ).rejects.toThrow()
    })
  })

  describe('addEmployee / addActivity / addTask', () => {
    it('associates employees and activities with the correct chart', async () => {
      const caller = createTestCaller(userA)
      const chart = await caller.ws.wdc.create({ organizationId: orgAId, unitId: unitAId, name: 'WDC 1' })

      const emp = await caller.ws.wdc.addEmployee({
        organizationId: orgAId,
        wdcId: chart.id,
        name: 'Jane Doe',
        role: 'Analyst',
        fte: '1.0',
      })
      expect(emp.name).toBe('Jane Doe')
      expect(emp.wdcChartId).toBe(chart.id)

      const act = await caller.ws.wdc.addActivity({
        organizationId: orgAId,
        wdcId: chart.id,
        name: 'Data Entry',
      })
      expect(act.name).toBe('Data Entry')
      expect(act.wdcChartId).toBe(chart.id)

      const task = await caller.ws.wdc.addTask({
        organizationId: orgAId,
        wdcId: chart.id,
        employeeId: emp.id,
        activityId: act.id,
        taskName: 'Enter records',
        hoursPerWeek: 10,
      })
      expect(task.taskName).toBe('Enter records')
      expect(task.hoursPerWeek).toBe(10)
    })
  })

  describe('tenant isolation', () => {
    it('user B cannot list WDC charts from org A', async () => {
      const callerB = createTestCaller(userB)
      await expect(
        callerB.ws.wdc.listByUnit({ organizationId: orgAId, unitId: unitAId })
      ).rejects.toThrow()
    })

    it('user B cannot get a WDC chart from org A', async () => {
      const callerA = createTestCaller(userA)
      const chart = await callerA.ws.wdc.create({ organizationId: orgAId, unitId: unitAId, name: 'Secret' })

      const callerB = createTestCaller(userB)
      await expect(
        callerB.ws.wdc.get({ organizationId: orgAId, wdcId: chart.id })
      ).rejects.toThrow()
    })
  })

  describe('regenerateShareToken', () => {
    it('generates a new share token different from the original', async () => {
      const caller = createTestCaller(userA)
      const chart = await caller.ws.wdc.create({ organizationId: orgAId, unitId: unitAId, name: 'Chart' })
      const originalToken = chart.shareToken

      const updated = await caller.ws.wdc.regenerateShareToken({ organizationId: orgAId, wdcId: chart.id })
      expect(updated.shareToken).toBeTruthy()
      expect(updated.shareToken).not.toBe(originalToken)
    })
  })
})
