import { createFileRoute } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import {
  Shield,
  Zap,
  Database,
  Bot,
  Users,
  ArrowRight,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  const { data: session } = authClient.useSession()

  const features = [
    {
      icon: <Shield className="w-8 h-8 text-cyan-400" />,
      title: 'Authentication',
      description: 'Email/password auth with Better Auth, sessions, and role-based access.',
    },
    {
      icon: <Users className="w-8 h-8 text-cyan-400" />,
      title: 'Multi-Tenant',
      description: 'Organization workspaces with member management and invitations.',
    },
    {
      icon: <Database className="w-8 h-8 text-cyan-400" />,
      title: 'Type-Safe Data',
      description: 'Drizzle ORM + tRPC with end-to-end type safety from DB to UI.',
    },
    {
      icon: <Bot className="w-8 h-8 text-cyan-400" />,
      title: 'AI Built In',
      description: 'TanStack AI with multi-provider chat, structured output, and more.',
    },
    {
      icon: <Zap className="w-8 h-8 text-cyan-400" />,
      title: 'Full-Stack',
      description: 'TanStack Start with server functions, SSR, and streaming.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              CyberGov
            </span>{' '}
            <span className="text-gray-300">Starter</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
            Production-ready SaaS template
          </p>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            TanStack Start + Better Auth + Drizzle + tRPC + TanStack AI.
            Multi-tenant, type-safe, and AI-ready out of the box.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={session?.user ? '/_authed/dashboard' : '/signup'}
              className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              {session?.user ? 'Go to Dashboard' : 'Get Started'}
              <ArrowRight className="w-4 h-4" />
            </a>
            {!session?.user && (
              <a
                href="/signin"
                className="px-8 py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300"
            >
              <div className="mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
