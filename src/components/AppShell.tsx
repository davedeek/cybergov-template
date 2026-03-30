import { useState } from 'react'
import { Link, useNavigate, useSearch, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  Settings,
  ChevronDown,
  Building2,
  Sparkles,
  Image,
  FolderTree,
  Activity,
  LogOutIcon,
  GitBranch,
  FileSpreadsheet,
  ClipboardList
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useLiveQuery } from '@tanstack/react-db'
import { useOrganizationsCollection } from '@/db-collections'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

interface AppShellProps {
  children: React.ReactNode
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/todos', icon: CheckSquare, label: 'Todos' },
  { to: '/ai/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/ai/structured', icon: Sparkles, label: 'AI Structured' },
  { to: '/ai/image', icon: Image, label: 'AI Image' },
] as const

const wsNavItems = [
  { to: '/ws', icon: FolderTree, label: 'My Units' },
  { to: '/ws/process-charts', icon: GitBranch, label: 'Process Charts' },
  { to: '/ws/wdc-charts', icon: FileSpreadsheet, label: 'Work Distribution' },
] as const

const settingsItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/audit-log', icon: ClipboardList, label: 'Audit Log' },
] as const

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)

  const { data: session } = authClient.useSession()

  const orgsCollection = useOrganizationsCollection()
  const { data: liveOrgs = [] } = useLiveQuery(
    (q) => q.from({ o: orgsCollection }).select(({ o }) => o),
    [orgsCollection]
  )
  const orgs = liveOrgs as { organization: { id: number; name: string } }[]
  const search = useSearch({ strict: false }) as { orgId?: number }
  const currentOrgId = search?.orgId

  const currentOrg = orgs?.find(
    (o) => o.organization.id === currentOrgId,
  ) ?? orgs?.[0]

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/signin' })
  }

  const switchOrg = (orgId: number) => {
    setOrgDropdownOpen(false)
    navigate({ search: { orgId } } as Parameters<typeof navigate>[0])
  }

  // Helper to determine if a route is active (including nested WS routes)
  const isActive = (path: string) => {
    if (path === '/ws') {
      return currentPath === '/ws' || (currentPath.startsWith('/ws/') && 
        !currentPath.startsWith('/ws/process-charts') && 
        !currentPath.startsWith('/ws/wdc-charts'));
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r-0">
        <SidebarHeader className="bg-nd-ink py-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-nd-accent flex items-center justify-center rounded-none shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-serif font-bold text-white tracking-widest uppercase">CyberGov</span>
          </div>

          {/* Org Switcher */}
          <div className="relative mt-6 px-2">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={orgDropdownOpen}
              aria-label="Switch workspace"
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-nd-surface-dark hover:bg-nd-surface-dark/90 transition-colors text-sm text-white border border-nd-ink-muted rounded-none shadow-inner"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Building2 className="w-4 h-4 text-nd-accent flex-shrink-0" />
                <span className="truncate font-mono tracking-wider text-xs">
                  {currentOrg?.organization.name ?? 'SELECT WORKSPACE'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 flex-shrink-0 text-white/50" />
            </button>

            {orgDropdownOpen && orgs && (
              <div role="listbox" aria-label="Select workspace" className="absolute left-2 right-2 mt-1 bg-nd-surface-dark border border-nd-ink-muted shadow-xl z-50 py-1 max-h-60 overflow-auto rounded-none">
                {orgs.map((o) => (
                  <button
                    key={o.organization.id}
                    role="option"
                    aria-selected={o.organization.id === currentOrg?.organization.id}
                    onClick={() => switchOrg(o.organization.id)}
                    className={`w-full text-left px-3 py-2.5 text-xs font-mono uppercase tracking-widest hover:bg-white/5 transition-colors ${
                      o.organization.id === currentOrg?.organization.id
                        ? 'text-nd-accent font-bold bg-white/10'
                        : 'text-white/70'
                    }`}
                  >
                    {o.organization.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-nd-ink">
          <SidebarGroup>
            <SidebarGroupLabel className="text-white/40 uppercase text-[10px] font-mono tracking-[0.2em] mb-2 px-4">Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={item.label} className="rounded-none hover:bg-transparent hover:text-white">
                      <Link
                        to={item.to as string}
                        search={currentOrgId ? { orgId: currentOrgId } : {}}
                        className={`flex items-center gap-3 px-4 py-2 decoration-transparent font-serif text-sm transition-all ${isActive(item.to) ? 'text-white bg-nd-surface-dark border-l-2 border-nd-accent font-bold' : 'text-white/70 hover:text-white hover:bg-nd-surface-dark/50 border-l-2 border-transparent'}`}
                      >
                        <item.icon className={`w-4 h-4 ${isActive(item.to) ? 'text-nd-accent' : 'text-white/50'}`} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="h-[1px] bg-nd-surface-dark w-full my-4" />

          <SidebarGroup>
            <SidebarGroupLabel className="text-nd-accent uppercase text-[10px] font-mono tracking-[0.2em] mb-2 px-4">Work Simplification</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {wsNavItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={item.label} className="rounded-none hover:bg-transparent hover:text-white">
                      <Link
                        to={item.to as string}
                        search={currentOrgId ? { orgId: currentOrgId } : {}}
                        className={`flex items-center gap-3 px-4 py-2 decoration-transparent font-serif text-sm transition-all ${isActive(item.to) ? 'text-white bg-nd-surface-dark border-l-2 border-nd-flag-yellow font-bold' : 'text-white/70 hover:text-white hover:bg-nd-surface-dark/50 border-l-2 border-transparent'}`}
                      >
                        <item.icon className={`w-4 h-4 ${isActive(item.to) ? 'text-[#D4A017]' : 'text-white/50'}`} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="h-[1px] bg-nd-surface-dark w-full my-4" />

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive(item.to)} className="rounded-none hover:bg-transparent hover:text-white">
                      <Link
                        to={item.to as string}
                        search={currentOrgId ? { orgId: currentOrgId } : {}}
                        className={`flex items-center gap-3 px-4 py-2 decoration-transparent font-serif text-sm transition-all ${isActive(item.to) ? 'text-white bg-nd-surface-dark border-l-2 border-white' : 'text-white/70 hover:text-white hover:bg-nd-surface-dark/50 border-l-2 border-transparent'}`}
                      >
                        <item.icon className="w-4 h-4 text-white/50" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="bg-nd-ink border-t border-nd-surface-dark p-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link to="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-nd-surface-dark transition-colors w-full decoration-transparent group">
                <div className="w-8 h-8 rounded-none bg-nd-surface-alt flex items-center justify-center text-nd-ink text-sm font-bold font-mono flex-shrink-0 border border-[#C8C3B4]">
                  {session?.user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-serif font-bold text-white truncate group-hover:text-nd-accent transition-colors">
                    {session?.user?.name ?? 'User'}
                  </p>
                  <p className="text-[10px] font-mono tracking-wider text-white/50 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-mono tracking-[0.2em] uppercase text-white/50 hover:text-nd-accent hover:bg-nd-surface-dark transition-colors text-left border-t border-nd-surface-dark">
                <LogOutIcon className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] bg-nd-bg overflow-hidden font-sans text-nd-ink w-full relative">
        <header className="flex h-14 lg:h-16 items-center gap-4 border-b-2 border-nd-ink bg-[#FAF9F5] px-6 shrink-0 transition-colors z-10 relative">
          <SidebarTrigger className="text-nd-ink hover:text-nd-bg hover:bg-nd-ink transition-colors w-8 h-8 flex items-center justify-center border-2 border-nd-ink bg-white shadow-[2px_2px_0px_#1A1A18] rounded-none cursor-pointer" />
          <div className="flex-1 flex items-center gap-4 ml-2">
             <div className="h-5 w-[2px] bg-nd-accent rotate-12 opacity-50" />
             <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-nd-ink-muted">
               {currentPath === '/' ? 'ROOT' : currentPath.split('/').filter(Boolean).join(' / ')}
             </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full relative z-0">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
