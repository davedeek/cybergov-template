import { createFileRoute, useSearch } from '@tanstack/react-router'
import { LayoutDashboard, Users, CheckSquare, MessageSquare } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useTodosCollection, useMembersCollection } from '@/db-collections'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_authed/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const trpc = useTRPC()
  const { data: currentOrg } = useQuery(
    trpc.organization.getOrCreateCurrent.queryOptions(),
  )
  const search = useSearch({ strict: false }) as { orgId?: number }
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const todosCollection = useTodosCollection(orgId)
  const membersCollection = useMembersCollection(orgId)

  const { data: liveTodos = [] } = useLiveQuery(
    (q) => q.from({ t: todosCollection }).select(({ t }) => t),
    [todosCollection]
  )
  const { data: liveMembers = [] } = useLiveQuery(
    (q) => q.from({ m: membersCollection }).select(({ m }) => m),
    [membersCollection]
  )

  const todos = liveTodos as any[]
  const members = liveMembers as any[]

  const completedCount = todos?.filter((t) => t.completedAt).length ?? 0
  const pendingCount = (todos?.length ?? 0) - completedCount

  const stats = [
    {
      label: 'Total Todos',
      value: todos?.length ?? 0,
      icon: CheckSquare,
      color: 'from-cyan-500 to-blue-500',
    },
    {
      label: 'Pending',
      value: pendingCount,
      icon: LayoutDashboard,
      color: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckSquare,
      color: 'from-emerald-500 to-green-500',
    },
    {
      label: 'Members',
      value: members?.length ?? 0,
      icon: Users,
      color: 'from-violet-500 to-purple-500',
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto font-sans">
      <div className="mb-8 border-b-2 border-nd-ink pb-6">
        <h1 className="text-3xl font-bold font-serif text-nd-ink uppercase tracking-tight">
          {currentOrg?.organization.name ?? 'Dashboard'}
        </h1>
        <p className="text-nd-ink-muted mt-2">
          Welcome back! Here's an overview of your workspace.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-nd-surface border-2 border-nd-ink rounded-none shadow-[4px_4px_0px_#1A1A18] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#1A1A18] transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-nd-surface-alt border-b border-nd-border">
              <CardTitle className="text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-nd-ink-muted">
                {stat.label}
              </CardTitle>
              <div className="w-8 h-8 rounded-none bg-nd-ink flex items-center justify-center border border-nd-border shadow-inner">
                <stat.icon className="w-4 h-4 text-nd-bg" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-4xl font-serif font-black text-nd-ink">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card className="bg-nd-surface border-2 border-nd-ink rounded-none shadow-sm">
        <CardHeader className="border-b border-nd-border bg-[#FAF9F5]">
          <CardTitle className="text-sm font-mono tracking-widest uppercase text-nd-ink">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-16 justify-start gap-3 bg-nd-bg border-2 border-nd-border hover:border-nd-ink hover:bg-nd-surface-alt text-nd-ink rounded-none transition-colors"
              asChild
            >
              <a href={orgId ? `/todos?orgId=${orgId}` : '/todos'}>
                <CheckSquare className="w-5 h-5 text-nd-accent" />
                <span className="font-serif font-bold tracking-wide">Manage Todos</span>
              </a>
            </Button>
            <Button
              variant="outline"
              className="h-16 justify-start gap-3 bg-nd-bg border-2 border-nd-border hover:border-nd-ink hover:bg-nd-surface-alt text-nd-ink rounded-none transition-colors"
              asChild
            >
              <a href={orgId ? `/ai/chat?orgId=${orgId}` : '/ai/chat'}>
                <MessageSquare className="w-5 h-5 text-nd-accent" />
                <span className="font-serif font-bold tracking-wide">AI Chat</span>
              </a>
            </Button>
            <Button
              variant="outline"
              className="h-16 justify-start gap-3 bg-nd-bg border-2 border-nd-border hover:border-nd-ink hover:bg-nd-surface-alt text-nd-ink rounded-none transition-colors"
              asChild
            >
              <a href={orgId ? `/settings?orgId=${orgId}` : '/settings'}>
                <Users className="w-5 h-5 text-nd-accent" />
                <span className="font-serif font-bold tracking-wide">Invite Members</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
