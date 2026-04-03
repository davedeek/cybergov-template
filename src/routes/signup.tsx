import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SignUpForm } from '@/components/forms/SignUpForm'
import { authClient } from '@/lib/auth-client'
import { useQueryClient } from '@tanstack/react-query'
import { useMutationHandler } from '@/hooks/use-mutation-handler'

export const Route = createFileRoute('/signup')({
  component: SignUpPage,
  head: () => ({
    meta: [{ title: 'Sign Up — CyberGov' }],
  }),
})

function SignUpPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { handleMutation, isPending } = useMutationHandler()

  const handleSignUp = async (values: { name: string; email: string; password: string }) => {
    return handleMutation(
      async () => {
        const result = await authClient.signUp.email({
          name: values.name,
          email: values.email,
          password: values.password,
        })
        if (result.error) throw result.error
        await queryClient.invalidateQueries()
        navigate({ to: '/dashboard' })
      },
      { label: 'User Registration', successToast: 'Account created' }
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-nd-bg px-4 py-12">
      <div className="w-full max-w-md bg-nd-surface border-2 border-nd-ink shadow-stamp p-6">
        <div className="text-center mb-8">
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-4">New Registration</div>
          <h1 className="text-3xl font-serif font-bold text-nd-ink">Create account</h1>
          <p className="text-nd-ink-muted mt-2 font-sans text-sm">Get started with your workspace</p>
        </div>

        <SignUpForm onSubmit={handleSignUp} isPending={isPending} />

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
