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
    <div className="p-6 lg:p-8 max-w-3xl mx-auto font-sans">
      <div className="mb-8 border-b-2 border-nd-ink pb-6">
        <h1 className="text-3xl font-bold font-serif text-nd-ink uppercase tracking-tight flex items-center gap-3">
          <Settings className="w-6 h-6 text-nd-accent" />
          Organization Settings
        </h1>
        <p className="text-nd-ink-muted mt-2">
          Manage your workspace and team.
        </p>
      </div>

      {/* Org info */}
      <div className="bg-nd-surface rounded-none border-2 border-nd-ink p-6 mb-8 shadow-[4px_4px_0px_#1A1A18]">
        <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-4">Workspace Details</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#FAF9F5] border border-nd-border p-4">
            <span className="block text-xs font-mono uppercase tracking-wider text-nd-ink-muted mb-1">Name</span>
            <span className="font-serif font-bold text-lg text-nd-ink">{currentOrg?.organization.name}</span>
          </div>
          <div className="bg-[#FAF9F5] border border-nd-border p-4">
            <span className="block text-xs font-mono uppercase tracking-wider text-nd-ink-muted mb-1">Your role</span>
            <span className="font-serif font-bold text-lg text-nd-ink capitalize">{currentOrg?.membership.role}</span>
          </div>
        </div>
      </div>

      {/* Invite member */}
      <div className="bg-nd-surface rounded-none border-2 border-nd-ink p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-serif font-bold text-nd-ink mb-6 flex items-center gap-3">
          <UserPlus className="w-5 h-5 text-nd-accent" />
          Invite Member
        </h2>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="member@example.com"
            className="flex-1 px-4 py-3 bg-nd-bg border border-nd-border rounded-none text-nd-ink placeholder:text-nd-ink-muted focus:outline-none focus:border-nd-accent transition-colors font-sans"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
            className="px-4 py-3 bg-nd-bg border border-nd-border rounded-none text-nd-ink font-sans focus:outline-none focus:border-nd-accent cursor-pointer min-w-[120px]"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={!inviteEmail.trim() || inviteMutation.isPending}
            className="px-6 py-3 bg-nd-ink hover:bg-nd-ink/90 disabled:opacity-50 text-nd-bg font-serif font-bold tracking-wide rounded-none transition-colors border-2 border-nd-ink whitespace-nowrap"
          >
            Invite User
          </button>
        </form>
        {inviteMutation.isSuccess && (
          <p className="text-[#2B5EA7] font-mono text-xs uppercase tracking-widest font-bold mt-4">Invitation sent successfully.</p>
        )}
      </div>

      {/* Members list */}
      <div className="bg-nd-surface rounded-none border-2 border-nd-ink p-6 shadow-sm">
        <h2 className="text-xl font-serif font-bold text-nd-ink mb-6 flex items-center gap-3">
          <Shield className="w-5 h-5 text-nd-accent" />
          Members Directory ({members?.length ?? 0})
        </h2>
        {members?.length ? (
          <ul className="space-y-3">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between p-4 bg-nd-bg border border-nd-border rounded-none hover:border-nd-ink transition-colors"
              >
                <div>
                  <p className="text-sm font-mono tracking-wider font-bold text-nd-ink">{m.userId}</p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted mt-1">{m.role}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 bg-[#FAF9F5] border border-[#C8C3B4] border-dashed">
            <p className="font-mono text-xs uppercase tracking-widest text-nd-ink-muted">No members found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
