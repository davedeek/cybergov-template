import { createTRPCRouter, publicProcedure } from '../init'

export const meRouter = createTRPCRouter({
  // Use publicProcedure so this returns null instead of throwing UNAUTHORIZED.
  // The _authed layout checks the result and redirects if needed — a thrown error
  // would cause aggressive logout on transient network failures or stale refetches.
  session: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return null
    return {
      user: ctx.user,
      session: ctx.session,
    }
  }),
})
