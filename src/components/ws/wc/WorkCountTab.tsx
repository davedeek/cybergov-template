import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearch } from '@tanstack/react-router'
import type { WorkCount } from '@/types/entities'
import { BarChart3, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WorkCountTabProps {
  orgId: number
  unitId: number
}

export function WorkCountTab({ orgId, unitId }: WorkCountTabProps) {
  const trpc = useTRPC()
  const search = useSearch({ strict: false }) as { orgId?: number }

  const { data: workCounts = [], isLoading } = useQuery({
    ...trpc.ws.workCount.listByUnit.queryOptions({ organizationId: orgId, unitId }),
  })

  const typedCounts = workCounts as WorkCount[]

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nd-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-nd-surface p-6 border border-nd-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-nd-ink m-0 mb-1">Work Counts</h2>
            <p className="text-xs font-mono text-nd-ink-muted">
              Work counts for this unit are managed independently. Use the links below to view or
              create counts.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="rounded-none border-nd-border hover:border-nd-accent hover:text-nd-accent font-mono text-xs uppercase tracking-widest"
          >
            <Link
              to="/ws/$unitId"
              params={{ unitId: unitId.toString() }}
              search={search?.orgId ? { orgId: search.orgId } : {}}
            >
              <BarChart3 className="w-3 h-3 mr-2" /> Manage Counts
            </Link>
          </Button>
        </div>

        {typedCounts.length > 0 ? (
          <div className="space-y-3">
            {typedCounts.map((wc) => (
              <Link
                key={wc.id}
                to="/ws/$unitId/wc/$wcId"
                params={{ unitId: unitId.toString(), wcId: wc.id.toString() }}
                search={search?.orgId ? { orgId: search.orgId } : {}}
                className="flex items-center justify-between p-3 border border-nd-border bg-nd-bg hover:border-nd-accent transition-colors group"
              >
                <div>
                  <div className="text-sm font-serif font-bold text-nd-ink group-hover:text-nd-accent transition-colors">
                    {wc.name}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted mt-0.5">
                    {wc.period} &middot; {new Date(wc.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-nd-ink-muted group-hover:text-nd-accent transition-colors" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-nd-border bg-nd-surface-alt font-mono text-sm text-nd-ink-muted">
            <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-20" />
            No work counts for this unit yet. Create one from the unit dashboard.
          </div>
        )}
      </div>
    </div>
  )
}
