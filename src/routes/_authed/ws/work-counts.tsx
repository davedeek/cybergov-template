import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useAllWorkCountsCollection } from '@/db-collections'
import { BarChart3, Calendar, ArrowRight, Home } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_authed/ws/work-counts')({
  component: AllWorkCountsPage,
})

function AllWorkCountsPage() {
  const trpc = useTRPC()
  const search = useSearch({ strict: false }) as { orgId?: number }
  const { data: currentOrg } = useQuery(trpc.organization.getOrCreateCurrent.queryOptions())
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const wcCollection = useAllWorkCountsCollection(orgId)
  const { data: wcList = [], isLoading } = useLiveQuery(
    (q) => q.from({ wc: wcCollection }).select(({ wc }) => wc),
    [wcCollection],
  )

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nd-accent"></div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-nd-bg min-h-full">
      <div className="mb-8">
        <Link
          to="/ws"
          search={orgId ? { orgId } : {}}
          className="inline-flex items-center text-sm font-semibold text-nd-ink-muted hover:text-nd-accent mb-4 transition-colors"
        >
          <Home className="w-4 h-4 mr-1" />
          Back to Units
        </Link>
        <h1 className="text-3xl font-heading font-bold text-nd-ink">All Work Counts</h1>
        <p className="text-nd-ink-muted mt-2">
          View and manage all volume and frequency measurements across your organization.
        </p>
      </div>

      {wcList.length === 0 ? (
        <Card className="border-nd-border bg-nd-surface shadow-sm text-center py-16">
          <CardContent>
            <div className="w-16 h-16 bg-nd-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-nd-accent" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-nd-ink mb-2">
              No Work Counts Found
            </h3>
            <p className="text-nd-ink-muted mb-6 max-w-sm mx-auto">
              You haven't created any work counts yet. Go to a unit dashboard to create your first
              count.
            </p>
            <Button asChild className="bg-nd-accent hover:bg-nd-accent-hover">
              <Link to="/ws" search={orgId ? { orgId } : {}}>
                Go to Units
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wcList.map(
            (wc: {
              id: number
              name: string
              period: string
              unitId: number
              unitName: string
              createdAt: string
            }) => (
              <Card
                key={wc.id}
                className="border-nd-border bg-nd-surface shadow-sm hover:border-nd-accent/50 transition-colors flex flex-col"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-nd-flag-blue bg-nd-flag-blue/10 px-2 py-0.5 rounded">
                      {wc.unitName}
                    </span>
                    <span className="text-xs text-nd-ink-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(wc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-heading text-nd-ink mt-2">{wc.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted bg-nd-surface-alt px-2 py-1">
                    {wc.period}
                  </span>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-between hover:bg-nd-bg hover:text-nd-accent"
                  >
                    <Link
                      to="/ws/$unitId/wc/$wcId"
                      params={{ unitId: wc.unitId.toString(), wcId: wc.id.toString() }}
                      search={orgId ? { orgId } : {}}
                    >
                      Open Work Count
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  )
}
