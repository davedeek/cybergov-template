import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import AppShell from '@/components/AppShell'

const authedSearchSchema = z.object({
  orgId: z.number().optional(),
})

export const Route = createFileRoute('/_authed')({
  validateSearch: authedSearchSchema,

  beforeLoad: async ({ context }) => {
    // Check for authenticated session via tRPC
    try {
      const session = await context.queryClient.ensureQueryData(
        context.trpc.me.session.queryOptions(),
      )
      if (!session?.user) {
        throw redirect({ to: '/signin' })
      }
      return { session }
    } catch (e) {
      // If the query fails (unauthorized), redirect to signin
      if (e instanceof Error && !('to' in e)) {
        throw redirect({ to: '/signin' })
      }
      throw e
    }
  },

  component: AuthedLayout,

  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-nd-bg">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-nd-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-nd-ink-muted text-[10px] font-mono uppercase tracking-[0.2em] font-bold">Loading Data...</p>
      </div>
    </div>
  ),

  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-nd-bg font-sans">
      <div className="text-center max-w-md bg-nd-surface border-2 border-nd-ink p-8 shadow-[4px_4px_0px_#1A1A18]">
        <h1 className="text-2xl font-serif font-bold text-nd-flag-red mb-4 uppercase tracking-tight">System Error</h1>
        <p className="text-nd-ink-muted mb-8 font-mono text-xs">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-nd-ink hover:bg-nd-ink/90 text-nd-bg font-serif font-bold tracking-wide uppercase text-xs rounded-none border-2 border-nd-ink transition-colors w-full"
        >
          Try Again
        </button>
      </div>
    </div>
  ),
})

function AuthedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
