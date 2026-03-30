import { desc } from 'drizzle-orm'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, orgScopedProcedure } from '../init'
import { auditLogs } from '@/db/schema'

export const auditRouter = createTRPCRouter({
  listAll: orgScopedProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      limit: z.number().int().min(1).max(200).default(100),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.membership.role !== 'owner' && ctx.membership.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners and admins can view audit logs' })
      }

      return ctx.db.query.auditLogs.findMany({
        orderBy: desc(auditLogs.createdAt),
        limit: input.limit,
      })
    }),
})
