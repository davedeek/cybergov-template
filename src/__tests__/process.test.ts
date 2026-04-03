import { describe, it, expect, beforeEach } from 'vitest'
import { createTestCaller, db } from './setup'
import { organizations, organizationMemberships, users, units } from '../db/schema'

describe('Process Chart Router', () => {
  const userA = { id: 'user-a', name: 'User A', email: 'a@example.com' }
  const userB = { id: 'user-b', name: 'User B', email: 'b@example.com' }
  let orgAId: number
  let unitAId: number

  beforeEach(async () => {
    await db.insert(users).values([
      { ...userA, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
      { ...userB, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
    ])

    const [orgA] = await db.insert(organizations).values({ name: 'Org A' }).returning()
    const [orgB] = await db.insert(organizations).values({ name: 'Org B' }).returning()
    orgAId = orgA.id

    await db.insert(organizationMemberships).values([
      { organizationId: orgA.id, userId: userA.id, role: 'owner' },
      { organizationId: orgB.id, userId: userB.id, role: 'owner' },
    ])

    const [unitA] = await db
      .insert(units)
      .values({
        organizationId: orgAId,
        name: 'Unit A',
        createdByUserId: userA.id,
      })
      .returning()
    unitAId = unitA.id
  })

  describe('create', () => {
    it('creates a process chart with a non-null shareToken', async () => {
      const caller = createTestCaller(userA)
      const chart = await caller.ws.processChart.create({
        organizationId: orgAId,
        unitId: unitAId,
        name: 'Records Ingestion',
      })
      expect(chart.name).toBe('Records Ingestion')
      expect(chart.shareToken).toBeTruthy()
      expect(chart.shareToken).toHaveLength(64)
    })
  })

  describe('addStep / updateStep / removeStep', () => {
    it('adds, updates, and removes steps correctly', async () => {
      const caller = createTestCaller(userA)
      const chart = await caller.ws.processChart.create({
        organizationId: orgAId,
        unitId: unitAId,
        name: 'Test Process',
      })

      const step = await caller.ws.processChart.addStep({
        organizationId: orgAId,
        processChartId: chart.id,
        symbol: 'operation',
        description: 'Step 1',
        who: 'Clerk',
        minutes: 15,
      })
      expect(step.description).toBe('Step 1')
      expect(step.processChartId).toBe(chart.id)

      const updated = await caller.ws.processChart.updateStep({
        organizationId: orgAId,
        stepId: step.id,
        symbol: 'inspection',
        description: 'Updated Step 1',
      })
      expect(updated.description).toBe('Updated Step 1')
      expect(updated.symbol).toBe('inspection')

      await caller.ws.processChart.removeStep({ organizationId: orgAId, stepId: step.id })
      const steps = await caller.ws.processChart.listSteps({
        organizationId: orgAId,
        processChartId: chart.id,
      })
      expect(steps).toHaveLength(0)
    })
  })

  describe('reorderSteps', () => {
    it('reorders steps atomically', async () => {
      const caller = createTestCaller(userA)
      const chart = await caller.ws.processChart.create({
        organizationId: orgAId,
        unitId: unitAId,
        name: 'Reorder Test',
      })

      const s1 = await caller.ws.processChart.addStep({
        organizationId: orgAId,
        processChartId: chart.id,
        symbol: 'operation',
        description: 'A',
      })
      const s2 = await caller.ws.processChart.addStep({
        organizationId: orgAId,
        processChartId: chart.id,
        symbol: 'inspection',
        description: 'B',
      })

      await caller.ws.processChart.reorderSteps({
        organizationId: orgAId,
        processChartId: chart.id,
        stepIds: [s2.id, s1.id],
      })

      const steps = await caller.ws.processChart.listSteps({
        organizationId: orgAId,
        processChartId: chart.id,
      })
      const reordered = steps.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      expect(reordered[0].id).toBe(s2.id)
      expect(reordered[1].id).toBe(s1.id)
    })
  })

  describe('tenant isolation', () => {
    it('user B cannot list process charts from org A', async () => {
      const callerB = createTestCaller(userB)
      await expect(
        callerB.ws.processChart.listByUnit({ organizationId: orgAId, unitId: unitAId }),
      ).rejects.toThrow()
    })

    it('user B cannot get a process chart from org A', async () => {
      const callerA = createTestCaller(userA)
      const chart = await callerA.ws.processChart.create({
        organizationId: orgAId,
        unitId: unitAId,
        name: 'Secret',
      })

      const callerB = createTestCaller(userB)
      await expect(
        callerB.ws.processChart.get({ organizationId: orgAId, processChartId: chart.id }),
      ).rejects.toThrow()
    })
  })
})
