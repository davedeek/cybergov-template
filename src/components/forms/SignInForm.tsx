import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'
import { emailField } from '@/lib/validators'

interface SignInFormProps {
  onSubmit: (values: z.infer<typeof signinSchema>) => Promise<{ error?: { message: string } } | void>
  isPending?: boolean
}

const signinSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required').max(128),
})

export function SignInForm({ onSubmit, isPending: externalPending }: SignInFormProps) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: signinSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)
      const result = await onSubmit(value)
      if (result && result.error) {
        setError(result.error.message || 'Invalid credentials')
      }
    },
  })

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <form
      onSubmit={handleFormSubmit}
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
          name="email"
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
            </div>
          )}
        />
      </div>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button 
            type="submit" 
            className="w-full h-12 bg-nd-ink hover:bg-nd-accent text-nd-bg font-serif font-bold tracking-[0.1em] uppercase rounded-none transition-all border-2 border-nd-ink shadow-[4px_4px_0px_#C94A1E]"
            disabled={!canSubmit || isSubmitting || externalPending}
          >
            {isSubmitting || externalPending ? 'Authenticating...' : 'Sign In'}
          </Button>
        )}
      />
    </form>
  )
}
