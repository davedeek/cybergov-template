import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SignInForm } from '@/components/forms/SignInForm'
import { authClient } from '@/lib/auth-client'
import { useQueryClient } from '@tanstack/react-query'
import { useMutationHandler } from '@/hooks/use-mutation-handler'

export const Route = createFileRoute('/signin')({
  component: SignInPage,
  head: () => ({
    meta: [{ title: 'Sign In — CyberGov' }],
  }),
})

function SignInPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { handleMutation, isPending } = useMutationHandler()

  const handleSignIn = async (values: { email: string; password: string }) => {
    return handleMutation(
      async () => {
        const result = await authClient.signIn.email({
          email: values.email,
          password: values.password,
        })
        if (result.error) throw result.error
        await queryClient.invalidateQueries()
        navigate({ to: '/dashboard' })
      },
      { label: 'User Authentication', successToast: 'Signed in' }
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-nd-bg px-4 py-12">
      <div className="w-full max-w-md bg-nd-surface border-2 border-nd-ink shadow-[4px_4px_0px_#1A1A18] p-6">
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-4">Official Access</div>
          <h1 className="text-3xl font-serif font-bold text-nd-ink">Sign In</h1>
          <p className="text-nd-ink-muted mt-2 font-sans text-sm">Secure terminal for authorized personnel</p>
        </div>

        <SignInForm onSubmit={handleSignIn} isPending={isPending} />

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

