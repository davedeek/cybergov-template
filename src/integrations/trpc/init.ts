import { initTRPC, TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import superjson from 'superjson'
import { organizationMemberships } from '@/db/schema'
import type { createTRPCContext } from './context'

type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router

export const publicProcedure = t.procedure

// ─── Auth middleware ───────────────────────────────────────────────────────────

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

export const protectedProcedure = t.procedure.use(isAuthed)

// ─── Org-scoped middleware ─────────────────────────────────────────────────────

async function getMembershipOrThrow({
  db,
  userId,
  organizationId,
}: {
  db: Context['db']
  userId: string
  organizationId: number
}) {
  const membership = await db.query.organizationMemberships.findFirst({
    where: and(
      eq(organizationMemberships.organizationId, organizationId),
      eq(organizationMemberships.userId, userId),
    ),
  })

  if (!membership) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this organization',
    })
  }

  return membership
}

import { z } from 'zod'

const isOrgMember = t.middleware(async ({ ctx, next, input }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const { organizationId } = input as { organizationId: number }

  const membership = await getMembershipOrThrow({
    db: ctx.db,
    userId: ctx.user.id,
    organizationId,
  })

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      membership,
      organizationId,
    },
  })
})

export const orgScopedProcedure = protectedProcedure
  .input(z.object({ organizationId: z.number().int().positive() }))
  .use(isOrgMember)
