import { z } from 'zod'
import { eq } from 'drizzle-orm'
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

export const shareRouter = createTRPCRouter({
  getChartData: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // 1. Try to find a WDC chart
      const wdc = await ctx.db.query.wdcCharts.findFirst({
        where: eq(wdcCharts.shareToken, input.token),
      })
      
      if (wdc) {
        const unit = await ctx.db.query.units.findFirst({
          where: eq(units.id, wdc.unitId)
        })
        const employees = await ctx.db.query.wdcEmployees.findMany({
          where: eq(wdcEmployees.wdcChartId, wdc.id),
        })
        const activities = await ctx.db.query.wdcActivities.findMany({
          where: eq(wdcActivities.wdcChartId, wdc.id),
        })
        const tasks = await ctx.db.query.wdcTasks.findMany({
          where: eq(wdcTasks.wdcChartId, wdc.id),
        })

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
        const unit = await ctx.db.query.units.findFirst({
          where: eq(units.id, pc.unitId)
        })
        const steps = await ctx.db.query.processSteps.findMany({
          where: eq(processSteps.processChartId, pc.id),
        })

        return {
          type: 'process_chart' as const,
          unitName: unit?.name ?? 'Unknown Unit',
          chart: pc,
          steps: steps.sort((a, b) => a.sequenceNumber - b.sequenceNumber),
        }
      }

      throw new Error('Share link is invalid or has expired')
    }),
})
