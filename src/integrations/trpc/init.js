import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { createTRPCContext } from './context'

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router

export const publicProcedure = t.procedure

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
