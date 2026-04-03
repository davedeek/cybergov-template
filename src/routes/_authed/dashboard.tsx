import { createFileRoute, useSearch } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  MessageSquare,
  FileSpreadsheet,
  GitBranch,
  Building2,
  BookOpen,
} from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import {
  useTodosCollection,
  useMembersCollection,
  useUnitsCollection,
  useAllProcessChartsCollection,
  useAllWDCChartsCollection,
} from '@/db-collections'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader, PageHeaderTitle, PageHeaderDescription } from '@/components/ui/page-header'

export const Route = createFileRoute('/_authed/dashboard')({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: 'Dashboard — CyberGov' }],
  }),
})

function DashboardPage() {
  const trpc = useTRPC()
  const { data: currentOrg } = useQuery(trpc.organization.getOrCreateCurrent.queryOptions())
  const search = useSearch({ strict: false }) as { orgId?: number }
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const todosCollection = useTodosCollection(orgId)
  const membersCollection = useMembersCollection(orgId)
  const unitsCollection = useUnitsCollection(orgId)
  const allPcCollection = useAllProcessChartsCollection(orgId)
  const allWdcCollection = useAllWDCChartsCollection(orgId)

  const { data: liveTodos = [] } = useLiveQuery(
    (q) => q.from({ t: todosCollection }).select(({ t }) => t),
    [todosCollection],
  )
  const { data: liveMembers = [] } = useLiveQuery(
    (q) => q.from({ m: membersCollection }).select(({ m }) => m),
    [membersCollection],
  )
  const { data: liveUnits = [] } = useLiveQuery(
    (q) => q.from({ u: unitsCollection }).select(({ u }) => u),
    [unitsCollection],
  )
  const { data: livePcCharts = [] } = useLiveQuery(
    (q) => q.from({ pc: allPcCollection }).select(({ pc }) => pc),
    [allPcCollection],
  )
  const { data: liveWdcCharts = [] } = useLiveQuery(
    (q) => q.from({ wdc: allWdcCollection }).select(({ wdc }) => wdc),
    [allWdcCollection],
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todos = liveTodos as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members = liveMembers as any[]

  const completedCount = todos?.filter((t) => t.completedAt).length ?? 0
  const pendingCount = (todos?.length ?? 0) - completedCount

  const stats = [
    {
      label: 'Total Todos',
      value: todos?.length ?? 0,
      icon: CheckSquare,
    },
    {
      label: 'Pending',
      value: pendingCount,
      icon: LayoutDashboard,
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckSquare,
    },
    {
      label: 'Members',
      value: members?.length ?? 0,
      icon: Users,
    },
  ]

  const wsStats = [
    {
      label: 'Units',
      value: liveUnits.length,
      icon: Building2,
    },
    {
      label: 'WDC Charts',
      value: liveWdcCharts.length,
      icon: FileSpreadsheet,
    },
    {
      label: 'Process Charts',
      value: livePcCharts.length,
      icon: GitBranch,
    },
  ]

  const totalItems =
    (todos?.length ?? 0) +
    (members?.length ?? 0) +
    liveUnits.length +
    livePcCharts.length +
    liveWdcCharts.length

  return (
    <PageContainer size="lg">
      <PageHeader>
        <PageHeaderTitle>
          {currentOrg?.organization.name ?? 'Dashboard'}
        </PageHeaderTitle>
        <PageHeaderDescription>
          Welcome back! Here's an overview of your workspace.
        </PageHeaderDescription>
      </PageHeader>

      {/* Empty state for new users */}
      {totalItems <= 1 && (
        <div className="mb-8 bg-nd-ink text-nd-bg border-2 border-nd-ink shadow-stamp-hover animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-nd-accent flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-serif font-bold mb-2">
                  Get started with Work Simplification
                </h3>
                <p className="text-sm font-serif leading-relaxed text-nd-bg/80 mb-6">
                  Your workspace is empty. Start by creating a unit and charting
                  your team's processes, or load example data to explore the
                  tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="accent"
                    asChild
                  >
                    <a href={orgId ? `/ws?orgId=${orgId}` : '/ws'}>
                      <Building2 className="w-4 h-4 mr-2" />
                      Create Your First Unit
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-nd-bg/30 text-nd-bg/70 hover:text-nd-bg hover:border-nd-bg font-mono text-xs uppercase tracking-widest bg-transparent"
                    asChild
                  >
                    <a href={orgId ? `/ws?orgId=${orgId}` : '/ws'}>
                      Load Example Data
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            variant="stamped"
          >
            <CardHeader variant="stamped" className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-nd-ink-muted">
                {stat.label}
              </CardTitle>
              <div className="w-8 h-8 bg-nd-ink flex items-center justify-center border border-nd-border shadow-inner">
                <stat.icon className="w-4 h-4 text-nd-bg" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-4xl font-serif font-black text-nd-ink">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Work Simplification Section */}
      <Card variant="flat" className="mb-8">
        <CardHeader variant="warm">
          <CardTitle className="text-sm font-mono tracking-widest uppercase text-nd-ink">
            Work Simplification
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {wsStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 p-4 bg-nd-bg border border-nd-border"
              >
                <div className="w-10 h-10 bg-nd-ink flex items-center justify-center shrink-0">
                  <stat.icon className="w-5 h-5 text-nd-bg" />
                </div>
                <div>
                  <div className="text-2xl font-serif font-black text-nd-ink">{stat.value}</div>
                  <div className="text-[10px] font-mono text-nd-ink-muted uppercase tracking-[0.2em]">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="action"
            size="tall"
            className="w-full sm:w-auto"
            asChild
          >
            <a href={orgId ? `/ws?orgId=${orgId}` : '/ws'}>
              <Building2 className="w-5 h-5 text-nd-accent" />
              <span>View Units</span>
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card variant="flat">
        <CardHeader variant="warm">
          <CardTitle className="text-sm font-mono tracking-widest uppercase text-nd-ink">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              variant="action"
              size="hero"
              asChild
            >
              <a href={orgId ? `/todos?orgId=${orgId}` : '/todos'}>
                <CheckSquare className="w-5 h-5 text-nd-accent" />
                <span>Manage Todos</span>
              </a>
            </Button>
            <Button
              variant="action"
              size="hero"
              asChild
            >
              <a href={orgId ? `/ai/chat?orgId=${orgId}` : '/ai/chat'}>
                <MessageSquare className="w-5 h-5 text-nd-accent" />
                <span>AI Chat</span>
              </a>
            </Button>
            <Button
              variant="action"
              size="hero"
              asChild
            >
              <a href={orgId ? `/settings?orgId=${orgId}` : '/settings'}>
                <Users className="w-5 h-5 text-nd-accent" />
                <span>Invite Members</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
