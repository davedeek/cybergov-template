import { createTRPCRouter } from './init'
import { meRouter } from './routers/me'
import { organizationRouter } from './routers/organization'
import { todosRouter } from './routers/todos'
import { wsRouter } from './routers/ws'
import { shareRouter } from './routers/share'

export const appRouter = createTRPCRouter({
  me: meRouter,
  organization: organizationRouter,
  todos: todosRouter,
  ws: wsRouter,
  share: shareRouter,
})

export type AppRouter = typeof appRouter

export const trpcRouter = appRouter
export type TRPCRouter = typeof trpcRouter
