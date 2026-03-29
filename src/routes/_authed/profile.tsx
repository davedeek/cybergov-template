import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { User, Save } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { z } from 'zod'
import { FormError } from '@/components/ui/form-error'

export const Route = createFileRoute('/_authed/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: session } = authClient.useSession()
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
 
  const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
  })

  const form = useForm({
    defaultValues: {
      name: session?.user?.name ?? '',
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      setSaved(false)

      try {
        await authClient.updateUser({ name: value.name })
        setSaved(true)
      } catch {
        // handle error
      } finally {
        setIsLoading(false)
      }
    },
  })

  // Reset saved state when value changes
  const nameValue = form.useStore((state) => state.values.name)
  useEffect(() => {
    setSaved(false)
  }, [nameValue])

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto font-sans">
      <div className="mb-8 border-b-2 border-nd-ink pb-6">
        <h1 className="text-3xl font-bold font-serif text-nd-ink uppercase tracking-tight flex items-center gap-3">
          <User className="w-6 h-6 text-nd-accent" />
          Profile
        </h1>
        <p className="text-nd-ink-muted mt-2">Manage your account settings.</p>
      </div>

      <Card className="bg-nd-surface border-2 border-nd-ink rounded-none shadow-[4px_4px_0px_#1A1A18]">
        <CardHeader className="bg-nd-surface-alt border-b-2 border-nd-ink py-4">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-nd-ink">
            User Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }} 
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={session?.user?.email ?? ''}
                disabled
                className="h-12 bg-nd-bg border-2 border-nd-border rounded-none text-nd-ink-muted cursor-not-allowed font-mono text-sm opacity-60 shadow-inner"
              />
            </div>

            <form.Field
              name="name"
              validators={{
                onChange: profileSchema.shape.name,
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted">
                    Legal Entity Name
                  </Label>
                  <Input
                    id={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-12 bg-nd-bg border-2 border-nd-border focus:border-nd-ink rounded-none text-nd-ink font-serif text-lg shadow-inner"
                  />
                  <FormError errors={field.state.meta.errors} />
                </div>
              )}
            />

            <div className="flex items-center gap-6 pt-6 border-t border-nd-border border-dashed">
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || isLoading}
                    className="px-8 h-12 bg-nd-ink hover:bg-nd-accent text-nd-bg font-serif font-bold tracking-widest uppercase rounded-none transition-all border-2 border-nd-ink flex items-center gap-3 shadow-[3px_3px_0px_#C94A1E]"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading || isSubmitting ? 'Processing...' : 'Save Artifacts'}
                  </Button>
                )}
              />
              {saved && (
                <span className="text-nd-flag-blue font-mono text-[10px] uppercase tracking-widest font-bold bg-nd-flag-blue/5 border border-nd-flag-blue px-2 py-1 italic">
                  Changes Committed
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

