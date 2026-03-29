import { desc, eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { createTRPCRouter, orgScopedProcedure } from '../../init'
import { units, processCharts, processSteps } from '@/db/schema'

export const processChartRouter = createTRPCRouter({
  create: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      unitId: z.number().int().positive(),
      name: z.string().min(1),
      startPoint: z.string().optional(),
      endPoint: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, input.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new Error('Unit not found')

      const inserted = await ctx.db
        .insert(processCharts)
        .values({
          unitId: input.unitId,
          name: input.name,
          startPoint: input.startPoint ?? null,
          endPoint: input.endPoint ?? null,
        })
        .returning()
      return inserted[0]
    }),

  get: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), processChartId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const chart = await ctx.db.query.processCharts.findFirst({
        where: eq(processCharts.id, input.processChartId),
      })
      if (!chart) throw new Error('Process chart not found')

      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, chart.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new Error('Access denied')

      const steps = await ctx.db.query.processSteps.findMany({
        where: eq(processSteps.processChartId, chart.id),
      })

      return { chart, steps: steps.sort((a, b) => a.sequenceNumber - b.sequenceNumber) }
    }),

  listByUnit: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), unitId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, input.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new Error('Unit not found')

      return ctx.db.query.processCharts.findMany({
        where: eq(processCharts.unitId, input.unitId),
        orderBy: desc(processCharts.id),
      })
    }),

  listAll: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({
          id: processCharts.id,
          unitId: processCharts.unitId,
          name: processCharts.name,
          createdAt: processCharts.createdAt,
          updatedAt: processCharts.updatedAt,
          unitName: units.name,
        })
        .from(processCharts)
        .innerJoin(units, eq(processCharts.unitId, units.id))
        .where(eq(units.organizationId, ctx.organizationId))
        .orderBy(desc(processCharts.id));
    }),

  listSteps: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), processChartId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.processSteps.findMany({
        where: eq(processSteps.processChartId, input.processChartId),
        orderBy: processSteps.sequenceNumber,
      })
    }),

  addStep: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      processChartId: z.number().int().positive(),
      symbol: z.enum(['operation', 'transportation', 'storage', 'inspection']),
      description: z.string().min(1),
      who: z.string().optional(),
      minutes: z.number().int().optional(),
      feet: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get the next sequence number
      const lastStep = await ctx.db.query.processSteps.findFirst({
        where: eq(processSteps.processChartId, input.processChartId),
        orderBy: desc(processSteps.sequenceNumber),
      })

      const inserted = await ctx.db
        .insert(processSteps)
        .values({
          processChartId: input.processChartId,
          sequenceNumber: (lastStep?.sequenceNumber ?? -1) + 1,
          symbol: input.symbol,
          description: input.description,
          who: input.who ?? null,
          minutes: input.minutes ?? null,
          feet: input.feet ?? null,
        })
        .returning()
      return inserted[0]
    }),

  updateStep: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      stepId: z.number().int().positive(),
      symbol: z.enum(['operation', 'transportation', 'storage', 'inspection']),
      description: z.string().min(1),
      who: z.string().optional(),
      minutes: z.number().int().optional(),
      feet: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(processSteps)
        .set({
          symbol: input.symbol,
          description: input.description,
          who: input.who ?? null,
          minutes: input.minutes ?? null,
          feet: input.feet ?? null,
        })
        .where(eq(processSteps.id, input.stepId))
        .returning()
      if (updated.length === 0) throw new Error('Step not found')
      return updated[0]
    }),

  removeStep: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      stepId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(processSteps).where(eq(processSteps.id, input.stepId))
      return { success: true }
    }),

  reorderSteps: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      processChartId: z.number().int().positive(),
      stepIds: z.array(z.number().int().positive()),
    }))
    .mutation(async ({ ctx, input }) => {
      for (let i = 0; i < input.stepIds.length; i++) {
        await ctx.db
          .update(processSteps)
          .set({ sequenceNumber: i })
          .where(eq(processSteps.id, input.stepIds[i]))
      }
      return { success: true }
    }),
})
