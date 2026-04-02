import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import AppShell from '@/components/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const authedSearchSchema = z.object({
  orgId: z.number().optional(),
})

export const Route = createFileRoute('/_authed')({
  validateSearch: authedSearchSchema,

  beforeLoad: async ({ context }) => {
    // Check for authenticated session via tRPC.
    // me.session is a publicProcedure that returns null when unauthenticated
    // (rather than throwing UNAUTHORIZED) so transient network errors don't
    // cause spurious logouts.
    const session = await context.queryClient.ensureQueryData({
      ...context.trpc.me.session.queryOptions(),
      staleTime: 1000 * 60 * 5, // cache session check for 5 min
      retry: 2, // retry transient failures before giving up
    })
    if (!session?.user) {
      throw redirect({ to: '/signin' })
    }
    return { session }
  },

  component: AuthedLayout,

  pendingComponent: () => (
    <div className="min-h-screen bg-nd-bg flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-serif font-bold text-nd-ink uppercase tracking-tight mb-2">
          CyberGov
        </div>
        <div className="w-12 h-1 bg-nd-accent mx-auto mb-6 animate-pulse" />
        <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-ink-muted">
          Loading workspace...
        </div>
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
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </AppShell>
  )
}
