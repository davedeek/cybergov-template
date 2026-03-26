import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  Settings,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  Building2,
  Sparkles,
  Image,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'

interface AppShellProps {
  children: React.ReactNode
}

const navItems = [
  { to: '/_authed/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/_authed/todos', icon: CheckSquare, label: 'Todos' },
  { to: '/_authed/ai/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/_authed/ai/structured', icon: Sparkles, label: 'AI Structured' },
  { to: '/_authed/ai/image', icon: Image, label: 'AI Image' },
  { to: '/_authed/settings', icon: Settings, label: 'Settings' },
] as const

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)

  const { data: session } = authClient.useSession()
  const trpc = useTRPC()

  const { data: orgs } = useQuery(trpc.organization.listMine.queryOptions())
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
    navigate({ search: { orgId } } as any)
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo + Org Switcher */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold text-white tracking-tight">
                CyberGov
              </span>
              <button
                className="lg:hidden text-gray-400 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Org Switcher */}
            <div className="relative">
              <button
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-sm text-gray-200"
              >
                <Building2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="truncate flex-1 text-left">
                  {currentOrg?.organization.name ?? 'Select workspace'}
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-400" />
              </button>

              {orgDropdownOpen && orgs && (
                <div className="absolute left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-auto">
                  {orgs.map((o) => (
                    <button
                      key={o.organization.id}
                      onClick={() => switchOrg(o.organization.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-600 transition-colors ${
                        o.organization.id === currentOrg?.organization.id
                          ? 'text-cyan-400'
                          : 'text-gray-300'
                      }`}
                    >
                      {o.organization.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to as string}
                search={currentOrgId ? { orgId: currentOrgId } : {}}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                activeProps={{
                  className:
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cyan-400 bg-cyan-500/10',
                }}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="p-3 border-t border-slate-700">
            <Link
              to={'/_authed/profile' as string}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors mb-1"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {session?.user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name ?? 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold text-white">CyberGov</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
