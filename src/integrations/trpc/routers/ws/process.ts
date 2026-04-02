import { desc, eq, and, sql } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, orgScopedProcedure } from '../../init'
import { units, processCharts, processSteps, stepAnnotations } from '@/db/schema'
import { logAudit } from '@/lib/audit'

export const processChartRouter = createTRPCRouter({
  create: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        unitId: z.number().int().positive(),
        name: z.string().min(1),
        startPoint: z.string().optional(),
        endPoint: z.string().optional(),
      }),
    )
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
      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'create',
        entityType: 'process_chart',
        entityId: String(inserted[0].id),
      })
      return inserted[0]
    }),

  regenerateShareToken: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        processChartId: z.number().int().positive(),
      }),
    )
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
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        processChartId: z.number().int().positive(),
      }),
    )
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
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        unitId: z.number().int().positive(),
      }),
    )
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
        .orderBy(desc(processCharts.id))
    }),

  listSteps: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        processChartId: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.processSteps.findMany({
        where: eq(processSteps.processChartId, input.processChartId),
        orderBy: processSteps.sequenceNumber,
      })
    }),

  addStep: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        processChartId: z.number().int().positive(),
        symbol: z.enum(['operation', 'transportation', 'storage', 'inspection']),
        description: z.string().min(1),
        who: z.string().optional(),
        minutes: z.number().int().optional(),
        feet: z.number().int().optional(),
      }),
    )
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
      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'create',
        entityType: 'process_step',
        entityId: String(inserted[0].id),
      })
      return inserted[0]
    }),

  insertStepAt: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        processChartId: z.number().int().positive(),
        afterStepId: z.number().int().positive().optional(),
        symbol: z.enum(['operation', 'transportation', 'storage', 'inspection']),
        description: z.string().min(1),
        who: z.string().optional(),
        minutes: z.number().int().optional(),
        feet: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let targetSeq = 0

      if (input.afterStepId) {
        const afterStep = await ctx.db.query.processSteps.findFirst({
          where: eq(processSteps.id, input.afterStepId),
        })
        if (afterStep) {
          targetSeq = afterStep.sequenceNumber + 1
        }
      }

      const inserted = await ctx.db.transaction((tx) => {
        // Bump all steps at or after the target position
        tx.update(processSteps)
          .set({ sequenceNumber: sql`${processSteps.sequenceNumber} + 1` })
          .where(
            and(
              eq(processSteps.processChartId, input.processChartId),
              sql`${processSteps.sequenceNumber} >= ${targetSeq}`,
            ),
          )
          .run()

        // Insert the new step
        const [newStep] = tx
          .insert(processSteps)
          .values({
            processChartId: input.processChartId,
            sequenceNumber: targetSeq,
            symbol: input.symbol,
            description: input.description,
            who: input.who ?? null,
            minutes: input.minutes ?? null,
            feet: input.feet ?? null,
          })
          .returning()
          .all()

        return newStep
      })

      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'create',
        entityType: 'process_step',
        entityId: String(inserted.id),
        details: { insertedAfter: input.afterStepId },
      })
      return inserted
    }),

  updateStep: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        stepId: z.number().int().positive(),
        symbol: z.enum(['operation', 'transportation', 'storage', 'inspection']),
        description: z.string().min(1),
        who: z.string().optional(),
        minutes: z.number().int().optional(),
        feet: z.number().int().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(processSteps)
        .set({
          symbol: input.symbol,
          description: input.description,
          who: input.who ?? null,
          minutes: input.minutes ?? null,
          feet: input.feet ?? null,
          notes: input.notes ?? null,
        })
        .where(eq(processSteps.id, input.stepId))
        .returning()
      if (updated.length === 0)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Step not found' })
      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'update',
        entityType: 'process_step',
        entityId: String(input.stepId),
      })
      return updated[0]
    }),

  removeStep: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        stepId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(processSteps).where(eq(processSteps.id, input.stepId))
      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'delete',
        entityType: 'process_step',
        entityId: String(input.stepId),
      })
      return { success: true }
    }),

  reorderSteps: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        processChartId: z.number().int().positive(),
        stepIds: z.array(z.number().int().positive()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction((tx) => {
        for (let i = 0; i < input.stepIds.length; i++) {
          tx.update(processSteps)
            .set({ sequenceNumber: i })
            .where(eq(processSteps.id, input.stepIds[i]))
            .run()
        }
      })
      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'update',
        entityType: 'process_chart_steps',
        details: { processChartId: input.processChartId },
      })
      return { success: true }
    }),

  listAnnotations: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        processChartId: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: stepAnnotations.id,
          stepId: stepAnnotations.stepId,
          question: stepAnnotations.question,
          note: stepAnnotations.note,
          proposedAction: stepAnnotations.proposedAction,
          createdAt: stepAnnotations.createdAt,
        })
        .from(stepAnnotations)
        .innerJoin(processSteps, eq(stepAnnotations.stepId, processSteps.id))
        .where(eq(processSteps.processChartId, input.processChartId))
    }),

  upsertAnnotation: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        stepId: z.number().int().positive(),
        question: z.enum(['what', 'why', 'where', 'when', 'who', 'how']),
        note: z.string(),
        proposedAction: z
          .enum(['eliminate', 'combine', 'reorder', 'delegate', 'simplify', 'none'])
          .default('none'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.stepAnnotations.findFirst({
        where: and(
          eq(stepAnnotations.stepId, input.stepId),
          eq(stepAnnotations.question, input.question),
        ),
      })

      if (existing) {
        const updated = await ctx.db
          .update(stepAnnotations)
          .set({ note: input.note, proposedAction: input.proposedAction })
          .where(eq(stepAnnotations.id, existing.id))
          .returning()
        return updated[0]
      }

      const inserted = await ctx.db
        .insert(stepAnnotations)
        .values({
          stepId: input.stepId,
          question: input.question,
          note: input.note,
          proposedAction: input.proposedAction,
        })
        .returning()
      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'create',
        entityType: 'step_annotation',
        entityId: String(inserted[0].id),
      })
      return inserted[0]
    }),

  removeAnnotation: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        annotationId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(stepAnnotations).where(eq(stepAnnotations.id, input.annotationId))
      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'delete',
        entityType: 'step_annotation',
        entityId: String(input.annotationId),
      })
      return { success: true }
    }),

  duplicateAsProposal: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        processChartId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const chart = await ctx.db.query.processCharts.findFirst({
        where: eq(processCharts.id, input.processChartId),
      })
      if (!chart) throw new TRPCError({ code: 'NOT_FOUND', message: 'Process chart not found' })

      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, chart.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })

      // Create duplicated chart as proposed
      const [newChart] = await ctx.db
        .insert(processCharts)
        .values({
          unitId: chart.unitId,
          name: `[Proposed] ${chart.name}`,
          startPoint: chart.startPoint,
          endPoint: chart.endPoint,
          storageWarnMinutes: chart.storageWarnMinutes,
          distanceWarnFeet: chart.distanceWarnFeet,
          chartState: 'proposed',
          linkedChartId: chart.id,
        })
        .returning()

      // Copy all steps
      const steps = await ctx.db.query.processSteps.findMany({
        where: eq(processSteps.processChartId, chart.id),
      })

      for (const step of steps) {
        await ctx.db.insert(processSteps).values({
          processChartId: newChart.id,
          sequenceNumber: step.sequenceNumber,
          symbol: step.symbol,
          description: step.description,
          who: step.who,
          minutes: step.minutes,
          feet: step.feet,
          notes: step.notes,
        })
      }

      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'create',
        entityType: 'process_chart',
        entityId: String(newChart.id),
        details: { duplicatedFrom: chart.id },
      })
      return newChart
    }),
})
