import { desc, eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, orgScopedProcedure } from '../../init'
import { workCounts, workCountEntries, processCharts, units } from '@/db/schema'
import { logAudit } from '@/lib/audit'

export const workCountRouter = createTRPCRouter({
  listByChart: orgScopedProcedure
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

      return ctx.db.query.workCounts.findMany({
        where: eq(workCounts.processChartId, input.processChartId),
        orderBy: desc(workCounts.createdAt),
      })
    }),

  create: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        processChartId: z.number().int().positive(),
        name: z.string().min(1),
        period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
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

      const [inserted] = await ctx.db
        .insert(workCounts)
        .values({
          processChartId: input.processChartId,
          name: input.name,
          period: input.period,
        })
        .returning()

      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'create',
        entityType: 'work_count',
        entityId: String(inserted.id),
      })
      return inserted
    }),

  listEntries: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        workCountId: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.workCountEntries.findMany({
        where: eq(workCountEntries.workCountId, input.workCountId),
        orderBy: workCountEntries.recordedAt,
      })
    }),

  upsertEntry: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        workCountId: z.number().int().positive(),
        stepId: z.number().int().positive(),
        count: z.number().int().min(0),
        recordedAt: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check for existing entry for this step + workCount
      const existing = await ctx.db.query.workCountEntries.findFirst({
        where: and(
          eq(workCountEntries.workCountId, input.workCountId),
          eq(workCountEntries.stepId, input.stepId),
        ),
      })

      if (existing) {
        const [updated] = await ctx.db
          .update(workCountEntries)
          .set({ count: input.count })
          .where(eq(workCountEntries.id, existing.id))
          .returning()
        return updated
      }

      const [inserted] = await ctx.db
        .insert(workCountEntries)
        .values({
          workCountId: input.workCountId,
          stepId: input.stepId,
          count: input.count,
        })
        .returning()
      return inserted
    }),

  removeEntry: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        entryId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(workCountEntries).where(eq(workCountEntries.id, input.entryId))
      return { success: true }
    }),

  remove: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        workCountId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(workCounts).where(eq(workCounts.id, input.workCountId))
      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'delete',
        entityType: 'work_count',
        entityId: String(input.workCountId),
      })
      return { success: true }
    }),
})
