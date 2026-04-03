import { auth } from '@/lib/auth'
import { db } from '@/db'

export type Session = Awaited<ReturnType<typeof auth.api.getSession>>

export async function createTRPCContext(opts: { req: Request }) {
  let session: Session | null = null

  try {
    session = await auth.api.getSession({
      headers: opts.req.headers,
    })
  } catch {
    session = null
  }

  return {
    req: opts.req,
    db,
    session,
    user: session?.user ?? null,
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>
