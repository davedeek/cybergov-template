import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, orgScopedProcedure } from '../init'
import { organizationMemberships, organizations, invitations } from '@/db/schema'

export const organizationRouter = createTRPCRouter({
  getOrCreateCurrent: protectedProcedure.query(async ({ ctx }) => {
    const existingMembership =
      await ctx.db.query.organizationMemberships.findFirst({
        where: eq(organizationMemberships.userId, ctx.user.id),
        orderBy: desc(organizationMemberships.id),
      })

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
    .input(z.object({ name: z.string().min(2) }))
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

  listMembers: orgScopedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ ctx }) => {
      return ctx.db.query.organizationMemberships.findMany({
        where: eq(
          organizationMemberships.organizationId,
          ctx.organizationId,
        ),
        orderBy: desc(organizationMemberships.id),
      })
    }),

  updateMemberRole: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        userId: z.string(),
        role: z.enum(['admin', 'member']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.membership.role !== 'owner' && ctx.membership.role !== 'admin') {
        throw new Error('Only owners and admins can change roles')
      }

      await ctx.db
        .update(organizationMemberships)
        .set({ role: input.role })
        .where(
          eq(organizationMemberships.organizationId, ctx.organizationId),
        )

      return { success: true }
    }),

  invite: orgScopedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        email: z.string().email(),
        role: z.enum(['admin', 'member']).default('member'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.membership.role !== 'owner' && ctx.membership.role !== 'admin') {
        throw new Error('Only owners and admins can invite members')
      }

      const inserted = await ctx.db
        .insert(invitations)
        .values({
          organizationId: ctx.organizationId,
          email: input.email,
          role: input.role,
          invitedByUserId: ctx.user.id,
        })
        .returning()

      return inserted[0]
    }),
})
