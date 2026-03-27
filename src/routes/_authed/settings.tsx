import { useState } from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Settings, UserPlus, Shield } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useMembersCollection } from '@/db-collections'

export const Route = createFileRoute('/_authed/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member')
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const search = useSearch({ strict: false }) as { orgId?: number }

  const { data: currentOrg } = useQuery(
    trpc.organization.getOrCreateCurrent.queryOptions(),
  )
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const membersCollection = useMembersCollection(orgId)
  const { data: liveMembers = [] } = useLiveQuery(
    (q) => q.from({ m: membersCollection }).select(({ m }) => m),
    [membersCollection]
  )
  const members = liveMembers as any[]

  const inviteMutation = useMutation(
    trpc.organization.invite.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries()
        setInviteEmail('')
      },
    }),
  )

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !orgId) return
    inviteMutation.mutate({
      organizationId: orgId,
      email: inviteEmail,
      role: inviteRole,
    })
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="w-6 h-6 text-cyan-400" />
          Organization Settings
        </h1>
        <p className="text-gray-400 mt-1">
          Manage your workspace and team.
        </p>
      </div>

      {/* Org info */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Workspace</h2>
        <p className="text-gray-300 text-sm">
          <span className="text-gray-500">Name:</span>{' '}
          {currentOrg?.organization.name}
        </p>
        <p className="text-gray-300 text-sm mt-1">
          <span className="text-gray-500">Your role:</span>{' '}
          <span className="capitalize">{currentOrg?.membership.role}</span>
        </p>
      </div>

      {/* Invite member */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-cyan-400" />
          Invite Member
        </h2>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="member@example.com"
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={!inviteEmail.trim() || inviteMutation.isPending}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Invite
          </button>
        </form>
        {inviteMutation.isSuccess && (
          <p className="text-emerald-400 text-xs mt-2">Invitation sent!</p>
        )}
      </div>

      {/* Members list */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Members ({members?.length ?? 0})
        </h2>
        {members?.length ? (
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
              >
                <div>
                  <p className="text-sm text-gray-200">{m.userId}</p>
                  <p className="text-xs text-gray-400 capitalize">{m.role}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm">No members found.</p>
        )}
      </div>
    </div>
  )
}
