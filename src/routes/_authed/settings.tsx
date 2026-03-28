import { useState } from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Settings, UserPlus, Shield } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useMembersCollection } from '@/db-collections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
            <UserPlus className="w-4 h-4" />
            Personnel Induction
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <Label htmlFor="invite-email" className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted">
                Member Transmission Endpoint (Email)
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="representative@domain.gov"
                className="h-12 bg-nd-bg border-2 border-nd-border rounded-none text-nd-ink placeholder:text-nd-ink-muted/50 focus:border-nd-ink transition-all font-mono text-sm shadow-inner"
              />
            </div>
            <div className="w-full md:w-[160px] space-y-2">
              <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted">
                Authorization Tier
              </Label>
              <Select 
                value={inviteRole} 
                onValueChange={(v) => setInviteRole(v as 'member' | 'admin')}
              >
                <SelectTrigger className="h-12 w-full bg-nd-bg border-2 border-nd-border rounded-none text-nd-ink font-mono text-xs focus:ring-nd-ink shadow-inner uppercase">
                  <SelectValue placeholder="Select Tier" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-nd-ink bg-nd-surface">
                  <SelectItem value="member" className="font-mono text-xs uppercase tracking-widest">Member</SelectItem>
                  <SelectItem value="admin" className="font-mono text-xs uppercase tracking-widest">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={!inviteEmail.trim() || inviteMutation.isPending}
              className="h-12 bg-nd-ink hover:bg-nd-accent text-nd-bg font-serif font-bold tracking-widest rounded-none transition-all border-2 border-nd-ink whitespace-nowrap px-8 uppercase shadow-[3px_3px_0px_#C94A1E]"
            >
              {inviteMutation.isPending ? 'Invoking...' : 'Induct User'}
            </Button>
          </form>
          {inviteMutation.isSuccess && (
            <div className="mt-6 p-3 bg-nd-flag-blue/5 border border-nd-flag-blue border-dashed text-nd-flag-blue font-mono text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Manifest Dispatched Successfully.
            </div>
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

