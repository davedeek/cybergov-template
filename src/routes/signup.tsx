import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/signup')({
  component: SignUpPage,
})

function SignUpPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message || 'Sign up failed')
      } else {
        await queryClient.invalidateQueries()
        navigate({ to: '/dashboard' })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-nd-bg px-4 py-12">
      <div className="w-full max-w-md bg-nd-surface border border-nd-border shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-4">New Registration</div>
          <h1 className="text-3xl font-serif font-bold text-nd-ink">Create account</h1>
          <p className="text-nd-ink-muted mt-2 font-sans text-sm">Get started with your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
             <div className="p-3 bg-[#FDF0ED] border-l-4 border-l-[#C94A1E] text-sm text-[#C94A1E] font-serif">
               {error}
             </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-mono uppercase tracking-wider text-nd-ink-muted mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-nd-bg border border-nd-border rounded-none text-nd-ink placeholder:text-nd-ink-muted/50 focus:outline-none focus:ring-1 focus:ring-nd-accent focus:border-nd-accent transition-colors font-sans"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-nd-ink-muted mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-nd-bg border border-nd-border rounded-none text-nd-ink placeholder:text-nd-ink-muted/50 focus:outline-none focus:ring-1 focus:ring-nd-accent focus:border-nd-accent transition-colors font-sans"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-nd-ink-muted mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-nd-bg border border-nd-border rounded-none text-nd-ink placeholder:text-nd-ink-muted/50 focus:outline-none focus:ring-1 focus:ring-nd-accent focus:border-nd-accent transition-colors font-sans"
                placeholder="••••••••"
              />
              <p className="text-[10px] font-mono tracking-wider text-nd-ink-muted mt-2 uppercase">At least 8 characters</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-nd-ink hover:bg-nd-ink/90 disabled:opacity-50 text-nd-bg font-serif font-bold tracking-wide transition-colors"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-8 pt-6 border-t border-nd-border/50 text-center text-sm text-nd-ink-muted">
          Already have an account?{' '}
          <a href="/signin" className="text-nd-accent hover:text-nd-accent-hover font-bold tracking-wide decoration-2 hover:underline underline-offset-4">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
