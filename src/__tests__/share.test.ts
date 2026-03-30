import { describe, it, expect, beforeEach } from 'vitest'
import { createTestCaller, db } from './setup'
import { organizations, organizationMemberships, users, units } from '../db/schema'

describe('Share Router', () => {
  const userA = { id: 'user-a', name: 'User A', email: 'a@example.com' }
  let orgAId: number
  let unitAId: number

  beforeEach(async () => {
    await db.insert(users).values([
      { ...userA, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
    ])

    const [orgA] = await db.insert(organizations).values({ name: 'Org A' }).returning()
    orgAId = orgA.id

    await db.insert(organizationMemberships).values([
      { organizationId: orgA.id, userId: userA.id, role: 'owner' },
    ])

    const [unitA] = await db.insert(units).values({
      organizationId: orgAId,
      name: 'Unit A',
      createdByUserId: userA.id,
    }).returning()
    unitAId = unitA.id
  })

  describe('getChartData', () => {
    it('returns WDC chart data for a valid token', async () => {
      const callerA = createTestCaller(userA)
      const chart = await callerA.ws.wdc.create({ organizationId: orgAId, unitId: unitAId, name: 'WDC Share Test' })

      const publicCaller = createTestCaller(null)
      const result = await publicCaller.share.getChartData({ token: chart.shareToken! })

      expect(result.type).toBe('wdc')
      expect(result.chart.name).toBe('WDC Share Test')
    })

    it('returns process chart data for a valid token', async () => {
      const callerA = createTestCaller(userA)
      const chart = await callerA.ws.processChart.create({ organizationId: orgAId, unitId: unitAId, name: 'PC Share Test' })

      const publicCaller = createTestCaller(null)
      const result = await publicCaller.share.getChartData({ token: chart.shareToken! })

      expect(result.type).toBe('process_chart')
      expect(result.chart.name).toBe('PC Share Test')
    })

    it('throws NOT_FOUND for an invalid token', async () => {
      const publicCaller = createTestCaller(null)
      await expect(
        publicCaller.share.getChartData({ token: 'nonexistent-token-abc123' })
      ).rejects.toThrow()
    })

    it('throws NOT_FOUND when token is an empty string', async () => {
      const publicCaller = createTestCaller(null)
      await expect(
        publicCaller.share.getChartData({ token: '' })
      ).rejects.toThrow()
    })
  })
})
