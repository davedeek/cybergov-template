import { createTRPCRouter } from './init'
import { meRouter } from './routers/me'
import { organizationRouter } from './routers/organization'
import { todosRouter } from './routers/todos'
import { wsRouter } from './routers/ws'
import { shareRouter } from './routers/share'
import { auditRouter } from './routers/audit'

export const appRouter = createTRPCRouter({
  me: meRouter,
  organization: organizationRouter,
  todos: todosRouter,
  ws: wsRouter,
  share: shareRouter,
  audit: auditRouter,
})

export type AppRouter = typeof appRouter

export const trpcRouter = appRouter
export type TRPCRouter = typeof trpcRouter
