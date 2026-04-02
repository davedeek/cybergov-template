import { desc, eq, and, sql } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, orgScopedProcedure } from '../../init'
import { workCounts, workCountEntries, units } from '@/db/schema'
import { logAudit } from '@/lib/audit'

export const workCountRouter = createTRPCRouter({
  listAll: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({
          id: workCounts.id,
          unitId: workCounts.unitId,
          name: workCounts.name,
          period: workCounts.period,
          createdAt: workCounts.createdAt,
          updatedAt: workCounts.updatedAt,
          unitName: units.name,
        })
        .from(workCounts)
        .innerJoin(units, eq(workCounts.unitId, units.id))
        .where(eq(units.organizationId, ctx.organizationId))
        .orderBy(desc(workCounts.id))
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

      return ctx.db.query.workCounts.findMany({
        where: eq(workCounts.unitId, input.unitId),
        orderBy: desc(workCounts.createdAt),
      })
    }),

  get: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        workCountId: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const wc = await ctx.db.query.workCounts.findFirst({
        where: eq(workCounts.id, input.workCountId),
      })
      if (!wc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Work count not found' })

      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, wc.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })

      const entries = await ctx.db.query.workCountEntries.findMany({
        where: eq(workCountEntries.workCountId, wc.id),
        orderBy: workCountEntries.sequenceNumber,
      })

      return { workCount: wc, entries }
    }),

  create: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        unitId: z.number().int().positive(),
        name: z.string().min(1),
        period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, input.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new TRPCError({ code: 'NOT_FOUND', message: 'Unit not found' })

      const [inserted] = await ctx.db
        .insert(workCounts)
        .values({
          unitId: input.unitId,
          name: input.name,
          period: input.period,
          shareToken: randomBytes(32).toString('hex'),
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

  regenerateShareToken: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        workCountId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const wc = await ctx.db.query.workCounts.findFirst({
        where: eq(workCounts.id, input.workCountId),
      })
      if (!wc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Work count not found' })

      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, wc.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })

      const [updated] = await ctx.db
        .update(workCounts)
        .set({ shareToken: randomBytes(32).toString('hex') })
        .where(eq(workCounts.id, input.workCountId))
        .returning()
      return updated
    }),

  addEntry: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        workCountId: z.number().int().positive(),
        description: z.string().min(1),
        count: z.number().int().min(0).default(0),
        stepId: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get next sequence number
      const lastEntry = await ctx.db.query.workCountEntries.findFirst({
        where: eq(workCountEntries.workCountId, input.workCountId),
        orderBy: desc(workCountEntries.sequenceNumber),
      })

      const [inserted] = await ctx.db
        .insert(workCountEntries)
        .values({
          workCountId: input.workCountId,
          description: input.description,
          sequenceNumber: (lastEntry?.sequenceNumber ?? -1) + 1,
          count: input.count,
          stepId: input.stepId ?? null,
        })
        .returning()

      await ctx.db
        .update(workCounts)
        .set({ updatedAt: sql`(unixepoch())` })
        .where(eq(workCounts.id, input.workCountId))

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
        orderBy: workCountEntries.sequenceNumber,
      })
    }),

  upsertEntry: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        workCountId: z.number().int().positive(),
        entryId: z.number().int().positive().optional(),
        description: z.string().min(1),
        count: z.number().int().min(0),
        stepId: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.entryId) {
        const [updated] = await ctx.db
          .update(workCountEntries)
          .set({
            description: input.description,
            count: input.count,
            stepId: input.stepId ?? null,
          })
          .where(eq(workCountEntries.id, input.entryId))
          .returning()
        return updated
      }

      // Get next sequence number
      const lastEntry = await ctx.db.query.workCountEntries.findFirst({
        where: eq(workCountEntries.workCountId, input.workCountId),
        orderBy: desc(workCountEntries.sequenceNumber),
      })

      const [inserted] = await ctx.db
        .insert(workCountEntries)
        .values({
          workCountId: input.workCountId,
          description: input.description,
          sequenceNumber: (lastEntry?.sequenceNumber ?? -1) + 1,
          count: input.count,
          stepId: input.stepId ?? null,
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
