import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { createTRPCRouter, orgScopedProcedure } from '../init'
import { todos } from '@/db/schema'

export const todosRouter = createTRPCRouter({
  list: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ ctx }) => {
      return ctx.db.query.todos.findMany({
        where: eq(todos.organizationId, ctx.organizationId),
        orderBy: desc(todos.id),
      })
    }),

  add: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const inserted = await ctx.db
        .insert(todos)
        .values({
          organizationId: ctx.organizationId,
          createdByUserId: ctx.user.id,
          name: input.name,
        })
        .returning()

      return inserted[0]
    }),

  update: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        id: z.number().int().positive(),
        name: z.string().min(1).optional(),
        completedAt: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {}
      if (input.name !== undefined) updates.name = input.name
      if (input.completedAt !== undefined)
        updates.completedAt = input.completedAt

      const updated = await ctx.db
        .update(todos)
        .set(updates)
        .where(eq(todos.id, input.id))
        .returning()

      return updated[0]
    }),

  delete: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        id: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(todos).where(eq(todos.id, input.id))
      return { success: true }
    }),
})
