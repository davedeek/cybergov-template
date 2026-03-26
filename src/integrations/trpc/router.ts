import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from './init'
import { organizationMemberships, organizations, todos } from '@/db/schema'
import type { TRPCContext } from './context'

async function getMembershipOrThrow({
  db,
  userId,
  organizationId,
}: {
  db: TRPCContext['db']
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
    throw new Error('You are not a member of this organization')
  }

  return membership
}

const meRouter = createTRPCRouter({
  session: protectedProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
      session: ctx.session,
    }
  }),
})

const organizationRouter = createTRPCRouter({
  getOrCreateCurrent: protectedProcedure.query(async ({ ctx }) => {
    const existingMembership = await ctx.db.query.organizationMemberships.findFirst(
      {
        where: eq(organizationMemberships.userId, ctx.user.id),
        orderBy: desc(organizationMemberships.id),
      },
    )

    if (existingMembership) {
      const organization = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, existingMembership.organizationId),
      })

      if (organization) {
        return {
          organization,
          membership: existingMembership,
        }
      }
    }

    const organizationName =
      ctx.user.name?.trim() ||
      ctx.user.email?.split('@')[0] ||
      'My Workspace'

    const inserted = await ctx.db
      .insert(organizations)
      .values({ name: `${organizationName}'s Workspace` })
      .returning()

    const organization = inserted[0]

    const memberships = await ctx.db
      .insert(organizationMemberships)
      .values({
        organizationId: organization.id,
        userId: ctx.user.id,
        role: 'owner',
      })
      .returning()

    return {
      organization,
      membership: memberships[0],
    }
  }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.query.organizationMemberships.findMany({
      where: eq(organizationMemberships.userId, ctx.user.id),
      orderBy: desc(organizationMemberships.id),
    })

    if (memberships.length === 0) return []

    const byOrgId = new Map(memberships.map((m) => [m.organizationId, m]))
    const orgs = await ctx.db.query.organizations.findMany()

    return orgs
      .filter((org) => byOrgId.has(org.id))
      .map((org) => ({
        organization: org,
        membership: byOrgId.get(org.id),
      }))
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const inserted = await ctx.db
        .insert(organizations)
        .values({ name: input.name })
        .returning()

      const organization = inserted[0]

      const membershipRows = await ctx.db
        .insert(organizationMemberships)
        .values({
          organizationId: organization.id,
          userId: ctx.user.id,
          role: 'owner',
        })
        .returning()

      return {
        organization,
        membership: membershipRows[0],
      }
    }),
})

const todosRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await getMembershipOrThrow({
        db: ctx.db,
        userId: ctx.user.id,
        organizationId: input.organizationId,
      })

      return ctx.db.query.todos.findMany({
        where: eq(todos.organizationId, input.organizationId),
        orderBy: desc(todos.id),
      })
    }),

  add: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getMembershipOrThrow({
        db: ctx.db,
        userId: ctx.user.id,
        organizationId: input.organizationId,
      })

      const inserted = await ctx.db
        .insert(todos)
        .values({
          organizationId: input.organizationId,
          createdByUserId: ctx.user.id,
          name: input.name,
        })
        .returning()

      return inserted[0]
    }),
})

export const trpcRouter = createTRPCRouter({
  me: meRouter,
  organization: organizationRouter,
  todos: todosRouter,
})

export type TRPCRouter = typeof trpcRouter
