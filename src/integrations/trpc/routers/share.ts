import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure } from '../init'
import {
  wdcCharts,
  wdcEmployees,
  wdcActivities,
  wdcTasks,
  processCharts,
  processSteps,
  units,
} from '@/db/schema'
import { logAudit } from '@/lib/server-logger'

// In-memory rate limiter: max 20 requests per minute per IP
const shareRateLimit = new Map<string, { count: number; resetAt: number }>()

function checkShareRateLimit(ip: string) {
  const now = Date.now()
  const entry = shareRateLimit.get(ip)
  if (entry && now < entry.resetAt) {
    if (entry.count >= 20) {
      throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please try again later.' })
    }
    entry.count++
  } else {
    shareRateLimit.set(ip, { count: 1, resetAt: now + 60_000 })
  }
}

export const shareRouter = createTRPCRouter({
  getChartData: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const ip =
        ctx.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        ctx.req.headers.get('x-real-ip') ??
        'unknown'
      checkShareRateLimit(ip)
      // 1. Try to find a WDC chart
      const wdc = await ctx.db.query.wdcCharts.findFirst({
        where: eq(wdcCharts.shareToken, input.token),
      })
      
      if (wdc) {
        const [unit, employees, activities, tasks] = await Promise.all([
          ctx.db.query.units.findFirst({ where: eq(units.id, wdc.unitId) }),
          ctx.db.query.wdcEmployees.findMany({ where: eq(wdcEmployees.wdcChartId, wdc.id) }),
          ctx.db.query.wdcActivities.findMany({ where: eq(wdcActivities.wdcChartId, wdc.id) }),
          ctx.db.query.wdcTasks.findMany({ where: eq(wdcTasks.wdcChartId, wdc.id) }),
        ])

        await logAudit(ctx.db, { userId: null, action: 'access', entityType: 'share_token', entityId: wdc.shareToken ?? undefined, details: { chartType: 'wdc', chartId: wdc.id } })
        return {
          type: 'wdc' as const,
          unitName: unit?.name ?? 'Unknown Unit',
          chart: wdc,
          employees,
          activities,
          tasks,
        }
      }

      // 2. Try to find a Process Chart
      const pc = await ctx.db.query.processCharts.findFirst({
        where: eq(processCharts.shareToken, input.token),
      })

      if (pc) {
        const [unit, steps] = await Promise.all([
          ctx.db.query.units.findFirst({ where: eq(units.id, pc.unitId) }),
          ctx.db.query.processSteps.findMany({ where: eq(processSteps.processChartId, pc.id) }),
        ])

        await logAudit(ctx.db, { userId: null, action: 'access', entityType: 'share_token', entityId: pc.shareToken ?? undefined, details: { chartType: 'process_chart', chartId: pc.id } })
        return {
          type: 'process_chart' as const,
          unitName: unit?.name ?? 'Unknown Unit',
          chart: pc,
          steps: steps.sort((a, b) => a.sequenceNumber - b.sequenceNumber),
        }
      }

      throw new TRPCError({ code: 'NOT_FOUND', message: 'Share link is invalid or has expired' })
    }),
})
