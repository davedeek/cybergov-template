import { desc, eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, orgScopedProcedure } from '../../init'
import { proposedChanges, units } from '@/db/schema'
import { logAudit } from '@/lib/audit'

export const changesRouter = createTRPCRouter({
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

      return ctx.db.query.proposedChanges.findMany({
        where: eq(proposedChanges.unitId, input.unitId),
        orderBy: desc(proposedChanges.createdAt),
      })
    }),

  createChange: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        unitId: z.number().int().positive(),
        chartType: z.enum(['wdc', 'process_chart']),
        chartId: z.number().int().positive(),
        description: z.string().min(1),
        beforeState: z.string().optional(),
        afterState: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, input.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new TRPCError({ code: 'NOT_FOUND', message: 'Unit not found' })

      const [inserted] = await ctx.db
        .insert(proposedChanges)
        .values({
          unitId: input.unitId,
          chartType: input.chartType,
          chartId: input.chartId,
          description: input.description,
          beforeState: input.beforeState ?? null,
          afterState: input.afterState ?? null,
        })
        .returning()

      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'create',
        entityType: 'proposed_change',
        entityId: String(inserted.id),
      })
      return inserted
    }),

  updateStatus: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        changeId: z.number().int().positive(),
        status: z.enum(['open', 'accepted', 'dismissed']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const change = await ctx.db.query.proposedChanges.findFirst({
        where: eq(proposedChanges.id, input.changeId),
      })
      if (!change) throw new TRPCError({ code: 'NOT_FOUND', message: 'Change not found' })

      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, change.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })

      const [updated] = await ctx.db
        .update(proposedChanges)
        .set({ status: input.status })
        .where(eq(proposedChanges.id, input.changeId))
        .returning()

      await logAudit(ctx.db, {
        userId: ctx.user.id,
        action: 'update',
        entityType: 'proposed_change',
        entityId: String(input.changeId),
        details: { status: input.status },
      })
      return updated
    }),
})
