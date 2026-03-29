import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { authClient } from '@/lib/auth-client'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'

interface SignUpFormProps {
  onSuccess: () => void
}

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setIsLoading(true)

      try {
        const result = await authClient.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
        })

        if (result.error) {
          setError(result.error.message || 'Sign up failed')
        } else {
          await queryClient.invalidateQueries()
          onSuccess()
        }
      } catch {
        setError('Something went wrong. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      {error && (
        <Alert variant="destructive" className="rounded-none border-2 border-nd-flag-red bg-nd-flag-red/5">
          <AlertDescription className="font-serif">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <form.Field
          name="name"
          validators={{
            onChange: signupSchema.shape.name,
          }}
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="text-xs font-mono uppercase tracking-wider text-nd-ink-muted">
                Name
              </Label>
              <Input
                id={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="h-10 bg-nd-bg border-nd-border rounded-none text-nd-ink placeholder:text-nd-ink-muted/50 focus-visible:ring-nd-accent transition-colors font-sans"
                placeholder="Your name"
              />
              <FormError errors={field.state.meta.errors} />
            </div>
          )}
        />

        <form.Field
          name="email"
          validators={{
            onChange: signupSchema.shape.email,
          }}
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="text-xs font-mono uppercase tracking-wider text-nd-ink-muted">
                Email
              </Label>
              <Input
                id={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="h-10 bg-nd-bg border-nd-border rounded-none text-nd-ink placeholder:text-nd-ink-muted/50 focus-visible:ring-nd-accent transition-colors font-sans"
                placeholder="you@example.com"
              />
              <FormError errors={field.state.meta.errors} />
            </div>
          )}
        />

        <form.Field
          name="password"
          validators={{
            onChange: signupSchema.shape.password,
          }}
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="text-xs font-mono uppercase tracking-wider text-nd-ink-muted">
                Password
              </Label>
              <Input
                id={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="h-10 bg-nd-bg border-nd-border rounded-none text-nd-ink placeholder:text-nd-ink-muted/50 focus-visible:ring-nd-accent transition-colors font-sans"
                placeholder="••••••••"
              />
              <FormError errors={field.state.meta.errors} />
              <p className="text-[10px] font-mono tracking-wider text-nd-ink-muted mt-2 uppercase">At least 8 characters</p>
            </div>
          )}
        />
      </div>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting || isLoading}
            className="w-full h-12 bg-nd-ink hover:bg-nd-ink/90 text-nd-bg font-serif font-bold tracking-wide transition-colors rounded-none"
          >
            {isLoading || isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        )}
      />
    </form>
  )
}
