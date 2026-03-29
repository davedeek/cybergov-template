import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SignInForm } from '@/components/forms/SignInForm'

export const Route = createFileRoute('/signin')({
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-nd-bg px-4 py-12">
      <div className="w-full max-w-md bg-nd-surface border-2 border-nd-ink shadow-[4px_4px_0px_#1A1A18] p-6">
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-4">Secure Gateway</div>
          <h1 className="text-3xl font-serif font-bold text-nd-ink">Welcome back</h1>
          <p className="text-nd-ink-muted mt-2 font-sans text-sm">Sign in to your account</p>
        </div>

        <SignInForm onSuccess={() => navigate({ to: '/dashboard' })} />

        <p className="mt-8 pt-6 border-t border-nd-border/50 text-center text-sm text-nd-ink-muted">
          Don't have an account?{' '}
          <a href="/signup" className="text-nd-accent hover:text-nd-accent-hover font-bold tracking-wide decoration-2 hover:underline underline-offset-4">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

