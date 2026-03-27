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
      icon: <Shield className="w-8 h-8 text-nd-accent" />,
      title: 'Authentication',
      description: 'Email/password auth with Better Auth, sessions, and role-based access.',
    },
    {
      icon: <Users className="w-8 h-8 text-nd-accent" />,
      title: 'Multi-Tenant',
      description: 'Organization workspaces with member management and invitations.',
    },
    {
      icon: <Database className="w-8 h-8 text-nd-accent" />,
      title: 'Type-Safe Data',
      description: 'Drizzle ORM + tRPC with end-to-end type safety from DB to UI.',
    },
    {
      icon: <Bot className="w-8 h-8 text-nd-accent" />,
      title: 'AI Built In',
      description: 'TanStack AI with multi-provider chat, structured output, and more.',
    },
    {
      icon: <Zap className="w-8 h-8 text-nd-accent" />,
      title: 'Full-Stack',
      description: 'TanStack Start with server functions, SSR, and streaming.',
    },
  ]

  return (
    <div className="min-h-screen bg-nd-bg">
      <section className="relative py-24 px-6 text-center border-b-[0.5px] border-nd-border bg-nd-surface-alt">
        <div className="relative max-w-4xl mx-auto">
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-6">Internal System Portal</div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-nd-ink mb-6 tracking-tight uppercase">
            CyberGov <span className="text-nd-ink-muted">Starter</span>
          </h1>
          <p className="text-xl md:text-2xl text-nd-ink-muted mb-8 font-serif">
            Production-ready SaaS template
          </p>
          <div className="w-16 h-1 bg-nd-accent mx-auto mb-8" />
          <p className="text-nd-ink max-w-2xl mx-auto mb-10 text-lg leading-relaxed mix-blend-multiply">
            TanStack Start + Better Auth + Drizzle + tRPC + TanStack AI.
            <br/>
            Multi-tenant, type-safe, and AI-ready out of the box.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={session?.user ? '/dashboard' : '/signup'}
              className="px-8 py-3.5 bg-nd-accent hover:bg-[#8A2B2B] text-white font-serif tracking-wide border-2 border-transparent transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {session?.user ? 'Go to Dashboard' : 'Get Started'}
              <ArrowRight className="w-4 h-4 hidden sm:block" />
            </a>
            {!session?.user && (
              <a
                href="/signin"
                className="px-8 py-3.5 bg-transparent hover:bg-black/5 text-nd-ink font-serif tracking-wide border-2 border-nd-ink transition-colors w-full sm:w-auto"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-nd-surface border-2 border-nd-ink p-8 hover:-translate-y-1 transition-transform duration-200 group"
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-lg font-bold font-serif text-nd-ink mb-3 uppercase tracking-wide">
                {feature.title}
              </h3>
              <p className="text-[#5C5A52] text-sm leading-relaxed font-sans">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
