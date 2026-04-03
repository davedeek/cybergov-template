import { createFileRoute } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  FileSpreadsheet,
  GitBranch,
  HelpCircle,
  Users,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: 'CyberGov — Work Simplification for Teams' },
      {
        name: 'description',
        content:
          'Map your team\'s work. Chart every process. Eliminate waste. CyberGov digitizes the proven Bureau of Budget method for improving workplace procedures.',
      },
    ],
  }),
})

function LandingPage() {
  const { data: session } = authClient.useSession()

  return (
    <div className="min-h-screen bg-nd-bg">
      {/* Hero */}
      <section className="relative py-24 md:py-32 px-6 text-center border-b-[0.5px] border-nd-border bg-nd-surface-alt">
        <div className="relative max-w-4xl mx-auto">
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-6">
            Work Simplification System
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-nd-ink mb-6 tracking-tight uppercase leading-tight">
            Map your team's work.{' '}
            <span className="text-nd-accent">Eliminate waste.</span>
          </h1>
          <div className="w-16 h-1 bg-nd-accent mx-auto mb-8" />
          <p className="text-nd-ink max-w-2xl mx-auto mb-10 text-lg md:text-xl leading-relaxed font-serif">
            CyberGov digitizes the proven Bureau of Budget method for improving
            workplace procedures. See who does what, chart every process step,
            and find what to eliminate, combine, or simplify.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={session?.user ? '/dashboard' : '/signup'}
              className="px-8 py-3.5 bg-nd-accent hover:bg-nd-accent-hover text-white font-serif tracking-wide border-2 border-transparent transition-all shadow-stamp hover:shadow-stamp-hover hover:-translate-y-0.5 active:shadow-stamp-pressed active:translate-y-0.5 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {session?.user ? 'Go to Dashboard' : 'Try It Free'}
              <ArrowRight className="w-4 h-4" />
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

      {/* How It Works */}
      <section className="py-20 px-6 border-b border-nd-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-2 text-center">
            How It Works
          </h2>
          <p className="text-2xl md:text-3xl font-serif font-bold text-nd-ink text-center mb-16 uppercase tracking-tight">
            Three tools. One method.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: FileSpreadsheet,
                title: 'Work Distribution Chart',
                description:
                  'Map who does what and how long it takes. Reveal overloaded employees, misdirected effort, and activities consuming too much time.',
              },
              {
                step: '02',
                icon: GitBranch,
                title: 'Process Chart',
                description:
                  'Chart each procedure step by step. Four symbols — Operation, Transportation, Storage, Inspection — expose hidden delays and redundancies.',
              },
              {
                step: '03',
                icon: HelpCircle,
                title: 'The Six Questions',
                description:
                  'Apply What, Why, Where, When, Who, and How to every step. Flag what to eliminate, combine, reorder, delegate, or simplify.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-[64px] font-serif font-black text-nd-border/50 leading-none mb-4">
                  {item.step}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-nd-ink flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-nd-bg" />
                  </div>
                  <h3 className="text-base font-bold font-serif text-nd-ink uppercase tracking-wide">
                    {item.title}
                  </h3>
                </div>
                <p className="text-nd-ink-muted text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-b border-nd-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-2 text-center">
            Built For Teams
          </h2>
          <p className="text-2xl md:text-3xl font-serif font-bold text-nd-ink text-center mb-16 uppercase tracking-tight">
            Everything you need to improve operations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Users className="w-6 h-6 text-nd-accent" />,
                title: 'Multi-Tenant Workspaces',
                description:
                  'Invite your team with role-based access. Each organization gets isolated data and its own dashboard.',
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-nd-accent" />,
                title: 'Work Counting',
                description:
                  'Track volume and frequency at each step. Discover whether delays come from volume surges or poor methods.',
              },
              {
                icon: <ClipboardCheck className="w-6 h-6 text-nd-accent" />,
                title: 'Automated Flags',
                description:
                  'Built-in analysis flags overloaded employees, excessive storage time, and control step stacking.',
              },
              {
                icon: <GitBranch className="w-6 h-6 text-nd-accent" />,
                title: 'Current vs. Proposed',
                description:
                  'Chart your current process, then create a linked proposed version. Compare side by side.',
              },
              {
                icon: <FileSpreadsheet className="w-6 h-6 text-nd-accent" />,
                title: 'Shareable Reports',
                description:
                  'Generate public read-only links for any chart. Share with stakeholders without requiring an account.',
              },
              {
                icon: <HelpCircle className="w-6 h-6 text-nd-accent" />,
                title: 'Six Questions Framework',
                description:
                  'Structured analysis workspace for every process step. Annotate, propose actions, and track improvements.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-nd-surface border-2 border-nd-ink p-8 hover:-translate-y-1 hover:shadow-stamp-hover transition-all duration-200 shadow-stamp"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-sm font-bold font-serif text-nd-ink mb-2 uppercase tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-nd-ink-muted text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Heritage */}
      <section className="py-20 px-6 bg-nd-ink text-nd-bg border-b border-nd-border">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-6">
            Proven Method
          </div>
          <blockquote className="text-xl md:text-2xl font-serif leading-relaxed mb-6 text-nd-bg/90">
            "Work simplification is an organized use of common sense to find
            easier and better ways of doing work."
          </blockquote>
          <cite className="text-sm font-mono text-nd-bg/50 uppercase tracking-widest">
            — Bureau of the Budget, 1945
          </cite>
          <p className="mt-8 text-nd-bg/70 text-sm leading-relaxed max-w-xl mx-auto">
            CyberGov brings the Bureau of Budget's Work Simplification program
            into the digital age. The same methods that modernized American
            government operations — now available as a modern web application for
            teams of 3–10 people.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-nd-ink mb-4 uppercase tracking-tight">
            Start simplifying today
          </h2>
          <p className="text-nd-ink-muted mb-8 text-lg font-serif">
            Create your workspace, import example data, and see results in
            minutes.
          </p>
          <a
            href={session?.user ? '/dashboard' : '/signup'}
            className="inline-flex items-center gap-2 px-10 py-4 bg-nd-accent hover:bg-nd-accent-hover text-white font-serif text-lg tracking-wide border-2 border-transparent transition-all shadow-stamp hover:shadow-stamp-hover hover:-translate-y-0.5 active:shadow-stamp-pressed active:translate-y-0.5"
          >
            {session?.user ? 'Go to Dashboard' : 'Try It Free'}
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-nd-ink py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-mono text-nd-ink-muted uppercase tracking-widest">
            CyberGov
          </div>
          <div className="text-xs font-mono text-nd-ink-muted">
            Built on the Bureau of Budget Work Simplification method
          </div>
        </div>
      </footer>
    </div>
  )
}
