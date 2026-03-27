import { createFileRoute, useSearch } from '@tanstack/react-router'
import { LayoutDashboard, Users, CheckSquare, MessageSquare } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useTodosCollection, useMembersCollection } from '@/db-collections'

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
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {currentOrg?.organization.name ?? 'Dashboard'}
        </h1>
        <p className="text-gray-400 mt-1">
          Welcome back! Here's an overview of your workspace.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-800 rounded-xl border border-slate-700 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{stat.label}</span>
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={orgId ? `/todos?orgId=${orgId}` : '/todos'}
            className="flex items-center gap-3 p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-gray-200">Manage Todos</span>
          </a>
          <a
            href={orgId ? `/ai/chat?orgId=${orgId}` : '/ai/chat'}
            className="flex items-center gap-3 p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-gray-200">AI Chat</span>
          </a>
          <a
            href={orgId ? `/settings?orgId=${orgId}` : '/settings'}
            className="flex items-center gap-3 p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Users className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-gray-200">Invite Members</span>
          </a>
        </div>
      </div>
    </div>
  )
}
