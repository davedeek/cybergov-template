import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Settings, Shield, AlertCircle } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useMembersCollection } from '@/db-collections'
import { useMutationHandler } from '@/hooks/use-mutation-handler'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InviteMemberForm } from '@/components/forms/InviteMemberForm'

export const Route = createFileRoute('/_authed/settings')({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: 'Settings — CyberGov' }],
  }),
})

function SettingsPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const search = useSearch({ strict: false }) as { orgId?: number }
  const { handleMutation, isPending, error: mutationError } = useMutationHandler()

  const { data: currentOrg } = useQuery(
    trpc.organization.getOrCreateCurrent.queryOptions(),
  )
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const membersCollection = useMembersCollection(orgId)
  const { data: liveMembers = [] } = useLiveQuery(
    (q) => q.from({ m: membersCollection }).select(({ m }) => m),
    [membersCollection]
  )
  const members = liveMembers as unknown as { id: number; userId: string; organizationId: number; role: string }[]

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto font-sans">
      {mutationError && (
        <div className="mb-6 p-4 bg-nd-accent/10 border-2 border-nd-accent text-nd-accent font-mono text-xs uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Registry Error: {mutationError}</span>
        </div>
      )}

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
      <Card className="bg-nd-surface border-2 border-nd-ink rounded-none shadow-[4px_4px_0px_#1A1A18] mb-10 overflow-hidden">
        <CardHeader className="bg-nd-surface-alt border-b-2 border-nd-ink py-4">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-nd-ink">
            Workspace Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-nd-bg border-2 border-nd-border p-5 shadow-inner">
              <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted mb-2">Legal Identifier</span>
              <span className="font-serif font-black text-2xl text-nd-ink uppercase tracking-tight">{currentOrg?.organization.name}</span>
            </div>
            <div className="bg-nd-bg border-2 border-nd-border p-5 shadow-inner">
              <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted mb-2">Clearance Level</span>
              <span className="font-serif font-black text-2xl text-nd-ink uppercase tracking-tight capitalize">{currentOrg?.membership.role}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite member */}
      <Card className="bg-nd-surface border-2 border-nd-ink rounded-none shadow-[4px_4px_0px_#1A1A18] mb-10 overflow-hidden">
        <CardHeader className="bg-nd-surface-alt border-b-2 border-nd-ink py-4">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-nd-ink flex items-center gap-2">
            Personnel Induction
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {orgId && (
            <InviteMemberForm 
              onSubmit={async (values) => {
                await handleMutation(
                  () => trpcClient.organization.invite.mutate({
                    organizationId: orgId,
                    email: values.email,
                    role: values.role,
                  }),
                  {
                    label: 'Invite Team Member',
                    successToast: 'Invitation sent',
                    onSuccess: () => queryClient.invalidateQueries()
                  }
                )
              }} 
              isPending={isPending}
            />
          )}
        </CardContent>
      </Card>

      {/* Members list */}
      <Card className="bg-nd-surface border-2 border-nd-ink rounded-none shadow-[4px_4px_0px_#1A1A18] overflow-hidden">
        <CardHeader className="bg-nd-surface-alt border-b-2 border-nd-ink py-4">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-nd-ink flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Personnel Directory ({members?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {members?.length ? (
            <ul className="space-y-3">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="group flex items-center justify-between p-5 bg-nd-bg border-2 border-nd-border rounded-none hover:border-nd-ink hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-nd-surface-alt border-2 border-nd-ink flex items-center justify-center font-mono font-black text-nd-ink shadow-sm group-hover:bg-nd-ink group-hover:text-nd-bg transition-colors">
                      {m.role?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-serif font-black tracking-tight text-nd-ink uppercase group-hover:text-nd-accent transition-colors">{m.userId}</p>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted mt-1 leading-none">{m.role} · Active Session</p>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-nd-flag-blue animate-pulse" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-20 bg-nd-bg border-2 border-nd-border border-dashed">
              <p className="font-mono text-[10px] uppercase tracking-widest text-nd-ink-muted">Awaiting personnel registry synchronization.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

