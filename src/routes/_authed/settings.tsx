import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Settings, Shield } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useMembersCollection } from '@/db-collections'
import { useMutationHandler } from '@/hooks/use-mutation-handler'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InviteMemberForm } from '@/components/forms/InviteMemberForm'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader, PageHeaderTitle, PageHeaderDescription } from '@/components/ui/page-header'
import { InlineError } from '@/components/ui/inline-error'
import { Label } from '@/components/ui/label'

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
    <PageContainer size="sm">
      {mutationError && (
        <InlineError>Registry Error: {mutationError}</InlineError>
      )}

      <PageHeader>
        <PageHeaderTitle className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-nd-accent" />
          Organization Settings
        </PageHeaderTitle>
        <PageHeaderDescription>
          Manage your workspace and team.
        </PageHeaderDescription>
      </PageHeader>

      {/* Org info */}
      <Card variant="stamped" className="mb-10 overflow-hidden hover:translate-y-0 hover:shadow-stamp">
        <CardHeader variant="stamped">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-nd-ink">
            Workspace Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-nd-bg border-2 border-nd-border p-5 shadow-inner">
              <Label variant="section" className="mb-2">Legal Identifier</Label>
              <span className="font-serif font-black text-2xl text-nd-ink uppercase tracking-tight">{currentOrg?.organization.name}</span>
            </div>
            <div className="bg-nd-bg border-2 border-nd-border p-5 shadow-inner">
              <Label variant="section" className="mb-2">Clearance Level</Label>
              <span className="font-serif font-black text-2xl text-nd-ink uppercase tracking-tight capitalize">{currentOrg?.membership.role}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite member */}
      <Card variant="stamped" className="mb-10 overflow-hidden hover:translate-y-0 hover:shadow-stamp">
        <CardHeader variant="stamped">
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
      <Card variant="stamped" className="overflow-hidden hover:translate-y-0 hover:shadow-stamp">
        <CardHeader variant="stamped">
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
                  className="animate-slide-in-row group flex items-center justify-between p-5 bg-nd-bg border-2 border-nd-border hover:border-nd-ink hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-nd-surface-alt border-2 border-nd-ink flex items-center justify-center font-mono font-black text-nd-ink shadow-sm group-hover:bg-nd-ink group-hover:text-nd-bg transition-colors">
                      {m.role?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-serif font-black tracking-tight text-nd-ink uppercase group-hover:text-nd-accent transition-colors">{m.userId}</p>
                      <Label variant="section" className="mt-1 leading-none">{m.role} · Active Session</Label>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-nd-flag-blue animate-pulse" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-20 bg-nd-bg border-2 border-nd-border border-dashed">
              <Label variant="section">Awaiting personnel registry synchronization.</Label>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
