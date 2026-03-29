import { createTRPCRouter, protectedProcedure } from '../init'

export const meRouter = createTRPCRouter({
  session: protectedProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
      session: ctx.session,
    }
  }),
})
