import { desc, eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { createTRPCRouter, orgScopedProcedure } from '../../init'
import { units } from '@/db/schema'
import { logAudit } from '@/lib/audit'

export const unitsRouter = createTRPCRouter({
  list: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ ctx }) => {
      return ctx.db.query.units.findMany({
        where: eq(units.organizationId, ctx.organizationId),
        orderBy: desc(units.id),
      })
    }),

  get: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive(), unitId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const unit = await ctx.db.query.units.findFirst({
        where: and(eq(units.id, input.unitId), eq(units.organizationId, ctx.organizationId)),
      })
      if (!unit) throw new Error('Unit not found')
      return unit
    }),

  create: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      name: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const inserted = await ctx.db
        .insert(units)
        .values({
          organizationId: ctx.organizationId,
          name: input.name,
          description: input.description ?? null,
          createdByUserId: ctx.user.id,
        })
        .returning()
      await logAudit(ctx.db, { userId: ctx.user.id, action: 'create', entityType: 'unit', entityId: String(inserted[0].id) })
      return inserted[0]
    }),
})
