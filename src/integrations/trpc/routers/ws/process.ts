import { desc, eq, and } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, orgScopedProcedure } from '../../init'
import { units, processCharts, processSteps } from '@/db/schema'
import { logAudit } from '@/lib/audit'

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
      if (!unit) throw new TRPCError({ code: 'NOT_FOUND', message: 'Unit not found' })

      const inserted = await ctx.db
        .insert(processCharts)
        .values({
          unitId: input.unitId,
          name: input.name,
          startPoint: input.startPoint ?? null,
          endPoint: input.endPoint ?? null,
          shareToken: randomBytes(32).toString('hex'),
        })
        .returning()
      await logAudit(ctx.db, { userId: ctx.user.id, action: 'create', entityType: 'process_chart', entityId: String(inserted[0].id) })
      return inserted[0]
    }),

  regenerateShareToken: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      processChartId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const chart = await ctx.db.query.processCharts.findFirst({
        where: eq(processCharts.id, input.processChartId),
      })
      if (!chart) throw new TRPCError({ code: 'NOT_FOUND', message: 'Process chart not found' })

      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, chart.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })

      const updated = await ctx.db
        .update(processCharts)
        .set({ shareToken: randomBytes(32).toString('hex') })
        .where(eq(processCharts.id, input.processChartId))
        .returning()
      return updated[0]
    }),

  get: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), processChartId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const chart = await ctx.db.query.processCharts.findFirst({
        where: eq(processCharts.id, input.processChartId),
      })
      if (!chart) throw new TRPCError({ code: 'NOT_FOUND', message: 'Process chart not found' })

      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, chart.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })

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
      if (!unit) throw new TRPCError({ code: 'NOT_FOUND', message: 'Unit not found' })

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
      await logAudit(ctx.db, { userId: ctx.user.id, action: 'create', entityType: 'process_step', entityId: String(inserted[0].id) })
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
      if (updated.length === 0) throw new TRPCError({ code: 'NOT_FOUND', message: 'Step not found' })
      await logAudit(ctx.db, { userId: ctx.user.id, action: 'update', entityType: 'process_step', entityId: String(input.stepId) })
      return updated[0]
    }),

  removeStep: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      stepId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(processSteps).where(eq(processSteps.id, input.stepId))
      await logAudit(ctx.db, { userId: ctx.user.id, action: 'delete', entityType: 'process_step', entityId: String(input.stepId) })
      return { success: true }
    }),

  reorderSteps: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      processChartId: z.number().int().positive(),
      stepIds: z.array(z.number().int().positive()),
    }))
    .mutation(async ({ ctx, input }) => {
      ctx.db.transaction((tx) => {
        for (let i = 0; i < input.stepIds.length; i++) {
          tx
            .update(processSteps)
            .set({ sequenceNumber: i })
            .where(eq(processSteps.id, input.stepIds[i]))
            .run()
        }
      })
      await logAudit(ctx.db, { userId: ctx.user.id, action: 'update', entityType: 'process_chart_steps', details: { processChartId: input.processChartId } })
      return { success: true }
    }),
})
