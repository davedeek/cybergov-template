import { createFileRoute, useSearch } from '@tanstack/react-router'
import { ClipboardList } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader, PageHeaderTitle, PageHeaderDescription } from '@/components/ui/page-header'
import { InlineError } from '@/components/ui/inline-error'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/_authed/audit-log')({
  component: AuditLogPage,
  head: () => ({
    meta: [{ title: 'Audit Log — CyberGov' }],
  }),
})

function AuditLogPage() {
  const trpc = useTRPC()
  const search = useSearch({ strict: false }) as { orgId?: number }

  const { data: currentOrg } = useQuery(
    trpc.organization.getOrCreateCurrent.queryOptions(),
  )
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const { data: logs, isLoading } = useQuery({
    ...trpc.audit.listAll.queryOptions({ organizationId: orgId ?? -1, limit: 100 }),
    enabled: !!orgId,
  })

  const role = currentOrg?.membership.role
  const canView = role === 'owner' || role === 'admin'

  if (!canView) {
    return (
      <PageContainer size="sm">
        <InlineError>Access Denied: Audit log requires owner or admin clearance</InlineError>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="lg" className="max-w-5xl">
      <PageHeader>
        <PageHeaderTitle className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-nd-accent" />
          Audit Log
        </PageHeaderTitle>
        <PageHeaderDescription>
          Activity record for your organization.
        </PageHeaderDescription>
      </PageHeader>

      <Card variant="stamped" className="overflow-hidden hover:translate-y-0 hover:shadow-stamp">
        <CardHeader variant="stamped">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-nd-ink">
            Activity Records ({logs?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Label variant="section">Loading records...</Label>
            </div>
          ) : logs?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b-2 border-nd-ink bg-nd-surface-alt">
                    <th className="text-left p-3 uppercase tracking-widest text-nd-ink-muted">Timestamp</th>
                    <th className="text-left p-3 uppercase tracking-widest text-nd-ink-muted">User</th>
                    <th className="text-left p-3 uppercase tracking-widest text-nd-ink-muted">Action</th>
                    <th className="text-left p-3 uppercase tracking-widest text-nd-ink-muted">Entity Type</th>
                    <th className="text-left p-3 uppercase tracking-widest text-nd-ink-muted">Entity ID</th>
                    <th className="text-left p-3 uppercase tracking-widest text-nd-ink-muted">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="animate-slide-in-row border-b border-nd-border hover:bg-nd-surface-alt transition-colors">
                      <td className="p-3 text-nd-ink-muted whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toISOString().replace('T', ' ').slice(0, 19) : '—'}
                      </td>
                      <td className="p-3 text-nd-ink truncate max-w-[120px]">{log.userId ?? '(public)'}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 uppercase tracking-wider font-bold ${
                          log.action === 'create' ? 'bg-nd-flag-blue/20 text-nd-flag-blue' :
                          log.action === 'delete' ? 'bg-nd-accent/20 text-nd-accent' :
                          log.action === 'access' ? 'bg-nd-border text-nd-ink-muted' :
                          'bg-nd-surface text-nd-ink'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-nd-ink">{log.entityType}</td>
                      <td className="p-3 text-nd-ink-muted">{log.entityId ?? '—'}</td>
                      <td className="p-3 text-nd-ink-muted truncate max-w-[200px]">
                        {log.details ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 bg-nd-bg border-2 border-nd-border border-dashed m-4">
              <Label variant="section">No audit records found.</Label>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
